<?php

namespace App\Services\Pagamento;

use App\Models\Apolice;
use App\Models\Pagamento;
use App\Models\Parcelas;
use App\Services\Financeiro\ParcelaFinanceiroService;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class PagamentoService
{
    public function __construct(
        private readonly ParcelaFinanceiroService $parcelaFinanceiroService,
    ) {}

    public function store(array $data)
    {
        try {
            return DB::transaction(function () use ($data) {
                // lockForUpdate na APÓLICE serializa todos os pagamentos dela.
                // Sem isso, dois operadores quitando ao mesmo tempo as duas
                // últimas parcelas atrasadas não enxergam o pagamento um do
                // outro (READ COMMITTED): ambos concluem "ainda tem parcela
                // atrasada", nenhum limpa suspensa_em, e 30 dias depois o
                // comando de inadimplência cancela uma apólice quitada.
                // A apólice é o ponto de serialização porque é o escopo da
                // regra de suspensão — travar só a parcela não resolveria,
                // já que cada transação mexe numa parcela diferente.
                $apolice = Apolice::whereKey($data['apolice_id'])
                    ->lockForUpdate()
                    ->first();

                if (! $apolice) {
                    throw new \Exception('Não existe a apólice informada.');
                }

                $parcela = Parcelas::where('apolice_id', $data['apolice_id'])
                    ->where('numero_parcela', $data['parcela'])
                    ->orderBy('id')
                    ->first();

                if (! $parcela) {
                    throw new \Exception('Não existe a parcela informada para esta apólice.');
                }

                // Calcula o valor de referência (original + multa + juros, se
                // atrasada) usando a DATA DE PAGAMENTO informada — não "hoje" —
                // pra não cobrar juros a mais num lançamento retroativo (ex:
                // cliente pagou dia 5, operador só lança no sistema dia 13).
                $dataPagamento = Carbon::parse($data['data_pagamento']);
                $calculo = $this->parcelaFinanceiroService->calcular($parcela, $dataPagamento);

                // O operador pode ajustar o valor manualmente (ex: desconto
                // negociado) — mas só quando marca isso explicitamente no
                // formulário. Inferir a intenção pela diferença entre o valor
                // digitado e o calculado não funciona: o campo vem
                // pré-preenchido com o cálculo feito na data de HOJE, então
                // qualquer lançamento retroativo divergia do recalculado e
                // era tratado como "escolha do operador", cobrando os juros
                // dos dias entre o pagamento real e o lançamento.
                $valorFinal = ! empty($data['valor_manual'])
                    ? round((float) $data['valor'], 2)
                    : round($calculo['valor_total'], 2);

                $pagamento = Pagamento::create([
                    ...$data,
                    'valor' => $valorFinal,
                    // Quem lançou. Vem do servidor, nunca do request — se
                    // viesse do formulário, o próprio operador poderia
                    // atribuir o lançamento a outra pessoa, que é o oposto
                    // do que uma trilha de auditoria serve. Null quando a
                    // origem é um comando agendado ou um seeder.
                    'registrado_por' => Auth::id(),
                ]);

                $parcela->update([
                    'status_pagamento' => 'paga',
                    'data_pagamento' => $data['data_pagamento'],
                    'forma_pagamento_efetiva' => $data['forma_pagamento'],
                ]);

                // Passa a apólice já travada, não $parcela->apolice: aquela
                // relação devolve null quando a apólice está arquivada
                // (soft-deleted por renovação), e o método é tipado.
                $this->reavaliarSuspensaoApolice($apolice);

                return $pagamento;
            });
        } catch (\Illuminate\Database\QueryException $e) {
            // 23505 = unique_violation. O Rule::unique do Form Request é um
            // check-then-act: em duplo clique ou duas abas, as duas
            // requisições passam pela validação e só o índice parcial
            // pagamentos_apolice_id_parcela_unique barra a segunda. Sem este
            // tratamento o operador via "Tente novamente" e tentava de novo,
            // quando na verdade o pagamento JÁ tinha sido registrado.
            if ($e->getCode() === '23505') {
                throw new \Exception('Essa parcela já foi registrada para esta apólice.');
            }

            Log::error('Erro de banco ao registrar pagamento', ['dados' => $data, 'erro' => $e->getMessage()]);
            throw new \Exception('Não foi possível registrar o pagamento. Tente novamente ou contate o suporte.');
        } catch (\Throwable $e) {
            // \Throwable e não \Exception: um TypeError é \Error e escapava
            // daqui E do catch do controller, virando erro 500 na cara do
            // usuário em vez de uma mensagem tratada.
            //
            // As mensagens abaixo já são seguras pro usuário — só mascara
            // quando for algo inesperado (ex: erro de banco).
            $mensagensDeNegocio = [
                'Não existe a parcela informada para esta apólice.',
                'Não existe a apólice informada.',
            ];

            if (in_array($e->getMessage(), $mensagensDeNegocio, true)) {
                throw new \Exception($e->getMessage());
            }

            Log::error('Erro ao registrar pagamento', ['dados' => $data, 'erro' => $e->getMessage()]);
            throw new \Exception('Não foi possível registrar o pagamento. Tente novamente ou contate o suporte.');
        }
    }

    /**
     * Se a apólice estava suspensa por atraso, só restabelece a garantia
     * quando NENHUMA parcela (2ª em diante) continuar em atraso — uma
     * apólice pode ter mais de uma parcela atrasada ao mesmo tempo, e pagar
     * só uma delas não deveria reabrir a cobertura antes da hora.
     */
    private function reavaliarSuspensaoApolice(?Apolice $apolice): void
    {
        // Aceita null de propósito: uma parcela pode apontar para apólice
        // arquivada (o renovar() preserva parcelas e pagamentos do ciclo
        // anterior). Com o tipo não-nulável, isso virava TypeError — que é
        // \Error, não \Exception, e escapava de todos os catches até o 500.
        // Mesma guarda que suspenderSeParcelaReabertaEstaAtrasada() já tinha.
        if (! $apolice || $apolice->suspensa_em === null) {
            return;
        }

        // != 'paga' (não só 'em_aberto') porque o job AtualizarParcelasVencidas
        // reclassifica parcela vencida em aberto para 'vencida' às 07h — com
        // 'em_aberto' aqui, essa checagem nunca achava a parcela atrasada
        // depois desse horário e reativava a apólice indevidamente.
        $aindaTemParcelaAtrasada = $apolice->parcelas()
            ->where('numero_parcela', '>=', 2)
            ->where('status_pagamento', '!=', 'paga')
            ->where('data_vencimento', '<', now()->startOfDay())
            ->exists();

        if (! $aindaTemParcelaAtrasada) {
            $apolice->update(['suspensa_em' => null]);
        }
    }

    public function count()
    {
        return Pagamento::count();
    }

    public function destroy(int $id)
    {
        try {
            DB::transaction(function () use ($id) {
                $pagamento = Pagamento::findOrFail($id);

                // Trava a APÓLICE primeiro, na MESMA ordem que o store().
                // Sem isso há deadlock: o store() adquiria apólice -> parcela
                // e este método adquiria parcela -> apólice (pelo
                // suspenderSeParcelaReabertaEstaAtrasada lá embaixo). Duas
                // operações simultâneas na mesma parcela travavam uma na
                // outra e o Postgres matava uma com SQLSTATE 40P01.
                //
                // A regra geral: quando duas transações tocam os mesmos
                // registros, o que evita deadlock não é travar — é travar
                // sempre na mesma ordem.
                Apolice::whereKey($pagamento->apolice_id)
                    ->lockForUpdate()
                    ->first();

                // Reabre a parcela — sem isso ela fica "paga" pra sempre mesmo
                // sem nenhum pagamento associado, e a constraint de unicidade
                // (apolice_id, parcela) impediria registrar outro pagamento nela
                $parcela = Parcelas::where('apolice_id', $pagamento->apolice_id)
                    ->where('numero_parcela', $pagamento->parcela)
                    ->first();

                // forma_pagamento_efetiva também precisa sair: sem isso a
                // parcela continuava alegando ter sido paga por boleto sem
                // existir nenhum pagamento, e esse dado vazava para as telas
                // e exports de apólice.
                //
                // E o status volta para 'vencida' quando o vencimento já
                // passou, em vez de 'em_aberto' — senão uma parcela vencida
                // há meses ficava classificada como em dia até o job das 07h
                // do dia seguinte reclassificar.
                $parcela?->update([
                    'status_pagamento' => Carbon::parse($parcela->data_vencimento)->lt(now()->startOfDay())
                        ? 'vencida'
                        : 'em_aberto',
                    'data_pagamento' => null,
                    'forma_pagamento_efetiva' => null,
                ]);

                // Grava o autor do estorno ANTES do soft delete: o registro
                // continua existindo na tabela, e é justamente ele que a
                // auditoria vai consultar para saber quem reverteu.
                $pagamento->update(['estornado_por' => Auth::id()]);
                $pagamento->delete();

                if ($parcela) {
                    $this->suspenderSeParcelaReabertaEstaAtrasada($parcela);
                }
            });
        } catch (ModelNotFoundException $e) {
            // Duplo clique no botão de estornar: o segundo já não encontra o
            // pagamento. Dizer "contate o suporte" para uma operação que deu
            // certo faz o operador tentar de novo achando que falhou.
            throw new \Exception('Esse pagamento já foi estornado.');
        } catch (\Throwable $e) {
            // \Throwable pelo mesmo motivo do store(): TypeError é \Error e
            // escaparia daqui virando 500.
            Log::error('Erro ao excluir pagamento', ['id' => $id, 'erro' => $e->getMessage()]);
            throw new \Exception('Não foi possível excluir o pagamento. Tente novamente ou contate o suporte.');
        }
    }

    /**
     * Excluir um pagamento pode reabrir uma parcela (2ª em diante) que já
     * estava vencida — sem isso a apólice ficaria indevidamente "em dia" até
     * o próximo horário do comando agendado (VerificarInadimplenciaParcelas,
     * dailyAt 07:15), até quase 24h depois do estorno. Mesma condição usada
     * lá, só que reavaliada na hora.
     */
    private function suspenderSeParcelaReabertaEstaAtrasada(Parcelas $parcela): void
    {
        $apolice = $parcela->apolice;

        if (! $apolice || $apolice->suspensa_em !== null) {
            return;
        }

        if ($parcela->numero_parcela >= 2 && Carbon::parse($parcela->data_vencimento)->lt(now()->startOfDay())) {
            $apolice->update(['suspensa_em' => now()]);
        }
    }

    // Todos os pagamentos (de todas as parcelas/apólices) de um mesmo cliente.
    // Limitado a $limite registros — evita carregar um histórico enorme de
    // uma vez só num cliente muito antigo.
    public function listarPorCliente(int $clienteId, int $limite = 100)
    {
        try {
            return Pagamento::with('apolice')
                ->whereHas('apolice', function ($query) use ($clienteId) {
                    $query->where('cliente_id', $clienteId);
                })
                // Mais recentes primeiro: com a ordenação crescente anterior,
                // o corte de $limite descartava as apólices MAIS NOVAS do
                // cliente — justamente as que o atendente quer ver — e o
                // truncamento era silencioso.
                ->orderByDesc('data_pagamento')
                ->orderByDesc('id')
                ->limit($limite)
                ->get()
                // Duas ordenações diferentes de propósito: o SQL ordena por
                // data decrescente para que o corte de $limite descarte os
                // pagamentos ANTIGOS (antes ele cortava as apólices mais
                // novas do cliente, silenciosamente). Já a exibição precisa
                // ficar agrupada por apólice e com as parcelas em ordem, que
                // é o que esta reordenação em memória devolve.
                ->sortBy([['apolice_id', 'asc'], ['parcela', 'asc']])
                ->values()
                ->map(function ($pagamento) {
                    return [
                        'id' => $pagamento->id,
                        'apolice_id' => $pagamento->apolice_id,
                        'apolice' => $pagamento->apolice->numero_apolice ?? '—',
                        'apolice_quantidade_parcelas' => $pagamento->apolice->quantidade_parcelas ?? null,
                        'parcela' => $pagamento->parcela,
                        'valor' => $pagamento->valor,
                        'data_pagamento' => $pagamento->data_pagamento,
                        'forma_pagamento' => $pagamento->forma_pagamento,
                        'status' => $pagamento->status,
                    ];
                });
        } catch (\Exception $e) {
            Log::error('Erro ao listar pagamentos do cliente', ['cliente_id' => $clienteId, 'erro' => $e->getMessage()]);
            throw new \Exception('Não foi possível carregar o histórico de pagamentos.');
        }
    }
}
