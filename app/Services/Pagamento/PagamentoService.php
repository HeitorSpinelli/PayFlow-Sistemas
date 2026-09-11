<?php

namespace App\Services\Pagamento;

use App\Models\Apolice;
use App\Models\Pagamento;
use App\Models\Parcelas;
use App\Services\Financeiro\ParcelaFinanceiroService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class PagamentoService
{
    public function __construct(
        private readonly ParcelaFinanceiroService $parcelaFinanceiroService,
    ) {}

    public function store(array $data)
    {
        return DB::transaction(function () use ($data) {
            $parcela = Parcelas::where('apolice_id', $data['apolice_id'])
                ->where('numero_parcela', $data['parcela'])
                ->first();

            if (! $parcela) {
                throw new \Exception('Não existe a parcela informada para esta apólice.');
            }

            // Recalcula o valor de verdade (original + multa + juros se estiver
            // atrasada) em vez de confiar no que foi digitado no formulário —
            // reaproveita a mesma regra usada em toda a cobrança de inadimplência,
            // não duplica esse cálculo aqui.
            $calculo = $this->parcelaFinanceiroService->calcular($parcela);

            $pagamento = Pagamento::create([
                ...$data,
                'valor' => $calculo['valor_total'],
            ]);

            $parcela->update([
                'status_pagamento' => 'paga',
                'data_pagamento' => $data['data_pagamento'],
                'forma_pagamento_efetiva' => $data['forma_pagamento'],
            ]);

            $this->reavaliarSuspensaoApolice($parcela->apolice);

            return $pagamento;
        });
    }

    /**
     * Se a apólice estava suspensa por atraso, só restabelece a garantia
     * quando NENHUMA parcela (2ª em diante) continuar em atraso — uma
     * apólice pode ter mais de uma parcela atrasada ao mesmo tempo, e pagar
     * só uma delas não deveria reabrir a cobertura antes da hora.
     */
    private function reavaliarSuspensaoApolice(Apolice $apolice): void
    {
        if ($apolice->suspensa_em === null) {
            return;
        }

        $aindaTemParcelaAtrasada = $apolice->parcelas()
            ->where('numero_parcela', '>=', 2)
            ->where('status_pagamento', 'em_aberto')
            ->where('data_vencimento', '<', now())
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

                // Reabre a parcela — sem isso ela fica "paga" pra sempre mesmo
                // sem nenhum pagamento associado, e a constraint de unicidade
                // (apolice_id, parcela) impediria registrar outro pagamento nela
                $parcela = Parcelas::where('apolice_id', $pagamento->apolice_id)
                    ->where('numero_parcela', $pagamento->parcela)
                    ->first();

                $parcela?->update([
                    'status_pagamento' => 'em_aberto',
                    'data_pagamento' => null,
                ]);

                $pagamento->delete();

                if ($parcela) {
                    $this->suspenderSeParcelaReabertaEstaAtrasada($parcela);
                }
            });
        } catch (\Exception $e) {
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

        if ($parcela->numero_parcela >= 2 && $parcela->data_vencimento < now()) {
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
                ->orderBy('apolice_id')
                ->orderBy('parcela')
                ->limit($limite)
                ->get()
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
