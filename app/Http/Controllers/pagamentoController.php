<?php

namespace App\Http\Controllers;

use App\Http\Requests\StorePagamentoRequest;
use App\Models\Apolice;
use App\Models\Pagamento;
use App\Models\Segurado;
use App\Services\Apolice\ApoliceService;
use App\Services\Exportacoes\ExportacaoPagamentoService;
use App\Services\Financeiro\ParcelaFinanceiroService;
use App\Services\Pagamento\PagamentoService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class pagamentoController extends Controller
{
    protected PagamentoService $pagamentoService;

    protected ParcelaFinanceiroService $parcelaFinanceiroService;

    protected ApoliceService $apoliceService;

    public function __construct(PagamentoService $pagamentoService, ParcelaFinanceiroService $parcelaFinanceiroService, ApoliceService $apoliceService)
    {
        $this->pagamentoService = $pagamentoService;
        $this->parcelaFinanceiroService = $parcelaFinanceiroService;
        $this->apoliceService = $apoliceService;
    }

    public function store(StorePagamentoRequest $request)
    {
        $data = $request->validated();

        try {
            $this->pagamentoService->store($data);

            return redirect()->back()->with('success', 'Pagamento registrado com sucesso!');
        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'Erro ao registrar pagamento: '.$e->getMessage());
        }
    }

    public function show(Request $request)
    {
        // Mostra só 1 linha por cliente (o pagamento mais recente entre todas
        // as parcelas/apólices dele) na listagem principal; o restante fica
        // disponível no histórico do cliente, aberto pelo menu de 3 pontos
        // DISTINCT ON é específico do Postgres: devolve a PRIMEIRA linha de
        // cada grupo segundo o ORDER BY, ou seja, já entrega só o pagamento
        // mais recente de cada cliente. Antes isso era feito com ->get() +
        // ->unique('cliente_id') em PHP, o que carregava TODOS os pagamentos
        // da base na memória a cada abertura da tela para descartar quase
        // todos (medido: 29 linhas carregadas para produzir 7, metade do
        // tempo total da página).
        //
        // O whereNull('apolices.deleted_at') é a correção do bug: o join cru
        // não aplica o escopo de SoftDeletes, então pagamentos de apólices
        // arquivadas entravam na disputa, venciam por serem mais recentes, e
        // a linha renderizava vazia (cliente "—", apólice "—") enquanto o
        // pagamento da apólice VIGENTE sumia da tela.
        // Os filtros entram AQUI DENTRO, antes do DISTINCT ON — não depois.
        // Aplicados depois, eles filtravam dentro dos 7 "mais recentes" em vez
        // de dentro dos 29 pagamentos: um cliente que pagou em pix mas cujo
        // último pagamento foi boleto sumia do filtro "Pix". O correto é
        // escolher o pagamento mais recente DE CADA CLIENTE já dentro do
        // conjunto filtrado.
        $busca = trim((string) $request->input('busca', ''));
        $formaPagamento = trim((string) $request->input('forma_pagamento', ''));

        $condicoes = [
            'pagamentos.deleted_at is null',
            'apolices.deleted_at is null',
        ];
        $bindings = [];

        if ($formaPagamento !== '') {
            $condicoes[] = 'pagamentos.forma_pagamento = ?';
            $bindings[] = $formaPagamento;
        }

        if ($busca !== '') {
            // ilike = LIKE sem diferenciar maiúsculas (específico do Postgres).
            // Mesmos três campos do scopeFilter, para a tela e a busca
            // concordarem.
            $condicoes[] = '(segurados.nome_completo ilike ? or segurados.cpf_cnpj ilike ? or apolices.numero_apolice ilike ?)';
            $termo = '%'.$busca.'%';
            $bindings = array_merge($bindings, [$termo, $termo, $termo]);
        }

        $idsPagamentosRecentes = collect(DB::select(
            'select distinct on (apolices.cliente_id) pagamentos.id
               from pagamentos
               join apolices on apolices.id = pagamentos.apolice_id
               join segurados on segurados.id = apolices.cliente_id
              where '.implode(' and ', $condicoes).'
              order by apolices.cliente_id,
                       pagamentos.data_pagamento desc,
                       pagamentos.id desc',
            $bindings
        ))->pluck('id');

        // registradoPor no eager load: sem ele, o ->through() abaixo dispara
        // uma query por linha para resolver o nome do operador (N+1).
        $pagamentos = Pagamento::with(['apolice.cliente', 'registradoPor'])
            ->whereIn('id', $idsPagamentosRecentes)
            ->paginate(10)
            ->withQueryString()
            ->through(function ($pagamento) {
                return [
                    'id' => $pagamento->id,
                    'apolice_id' => $pagamento->apolice_id,
                    'cliente_id' => $pagamento->apolice->cliente_id ?? null,
                    'cliente' => $pagamento->apolice->cliente->nome_completo ?? '—',
                    'apolice' => $pagamento->apolice->numero_apolice ?? '—',
                    'parcela' => $pagamento->parcela,
                    'valor' => $pagamento->valor,
                    'data_pagamento' => $pagamento->data_pagamento,
                    'forma_pagamento' => $pagamento->forma_pagamento,
                    'status' => $pagamento->status,
                    'observacoes' => $pagamento->observacoes,
                    // Auditoria que ninguém enxerga não inibe nada: o valor
                    // de uma trilha está em ser visível na hora da conferência,
                    // não só consultável no banco depois do problema.
                    'registrado_por' => $pagamento->registradoPor->name ?? null,
                ];
            });

        return inertia('FunctionsApp/pagamentos', [
            'pagamentos' => $pagamentos,
            'totalRecebido' => Pagamento::where('status', 'confirmado')->sum('valor'),
            'totalConfirmados' => Pagamento::where('status', 'confirmado')->count(),
            // Substituiu "Total de Parcelas" (uma contagem bruta, sem indicar
            // se precisa de alguma ação) — reaproveita a mesma regra de
            // "cliente devedor" já usada no dashboard (ApoliceService::
            // contarClientesDevedores()): tem parcela não paga e já vencida,
            // em qualquer apólice do cliente.
            'clientesComPendencia' => $this->apoliceService->contarClientesDevedores(),
            'segurados' => Segurado::select('id', 'nome_completo', 'cpf_cnpj')->get(),
            'apolices' => Apolice::select('id', 'numero_apolice', 'cliente_id', 'valor_premio_total', 'quantidade_parcelas')
                ->with([
                    'pagamentos:id,apolice_id,parcela',
                    'parcelas:id,apolice_id,numero_parcela,valor_parcela,data_vencimento,data_pagamento,status_pagamento',
                ])
                ->get()
                ->each(function ($apolice) {
                    // dias_atraso vem do model (mesma regra usada em ApoliceService::vencimentosProximos)
                    // pra distinguir parcela "a vencer" de parcela realmente atrasada
                    $apolice->parcelas->each(function ($parcela) {
                        $parcela->dias_atraso = $parcela->diasEmAtraso();

                        // Valor sugerido já com multa/juros (se atrasada), calculado
                        // com a data de hoje — é o que o formulário pré-preenche.
                        // O cálculo final na hora de salvar usa a data de pagamento
                        // que o operador realmente informar (PagamentoService::store()).
                        $parcela->valor_sugerido = $parcela->status_pagamento !== 'paga'
                            ? $this->parcelaFinanceiroService->calcular($parcela)['valor_total']
                            : null;
                    });
                }),
        ]);
    }

    public function destroy(int $id)
    {
        try {
            $this->pagamentoService->destroy($id);

            return redirect()->back()->with('success', 'Pagamento excluído com sucesso!');
        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'Erro ao excluir pagamento: '.$e->getMessage());
        }
    }

    public function porCliente(int $clienteId)
    {
        return response()->json(
            $this->pagamentoService->listarPorCliente($clienteId)
        );
    }

    public function exportar(Request $request, ExportacaoPagamentoService $exportacaoService)
    {
        // Repassa os filtros da tela: sem isso, o operador filtrava por
        // "Maria", via 1 resultado, clicava em Exportar e baixava a base
        // inteira achando que era o extrato dela.
        return $exportacaoService->exportarPagamentosCsv($request->only(['busca', 'forma_pagamento']));
    }

    public function exportarPorApolice(int $apoliceId, ExportacaoPagamentoService $exportacaoService)
    {
        return $exportacaoService->exportarPagamentosApoliceCsv($apoliceId);
    }
}
