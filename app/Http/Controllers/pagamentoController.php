<?php

namespace App\Http\Controllers;

use App\Http\Requests\StorePagamentoRequest;
use App\Models\Apolice;
use App\Models\Pagamento;
use App\Models\Parcelas;
use App\Models\Segurado;
use App\Services\Exportacoes\ExportacaoPagamentoService;
use App\Services\Pagamento\PagamentoService;
use Illuminate\Http\Request;

class pagamentoController extends Controller
{
    protected PagamentoService $pagamentoService;

    public function __construct(PagamentoService $pagamentoService)
    {
        $this->pagamentoService = $pagamentoService;
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
        $idsPagamentosRecentes = Pagamento::query()
            ->join('apolices', 'apolices.id', '=', 'pagamentos.apolice_id')
            ->orderBy('apolices.cliente_id')
            ->orderByDesc('pagamentos.data_pagamento')
            ->orderByDesc('pagamentos.id')
            ->get(['apolices.cliente_id', 'pagamentos.id'])
            ->unique('cliente_id')
            ->pluck('id');

        $pagamentos = Pagamento::with('apolice.cliente')
            ->whereIn('id', $idsPagamentosRecentes)
            ->filter($request->all())
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
                ];
            });

        return inertia('FunctionsApp/pagamentos', [
            'pagamentos' => $pagamentos,
            'totalRecebido' => Pagamento::where('status', 'confirmado')->sum('valor'),
            'totalConfirmados' => Pagamento::where('status', 'confirmado')->count(),
            'totalParcelas' => Parcelas::count(),
            'segurados' => Segurado::select('id', 'nome_completo', 'cpf_cnpj')->get(),
            'apolices' => Apolice::select('id', 'numero_apolice', 'cliente_id', 'valor_premio_total', 'quantidade_parcelas')
                ->with(['pagamentos:id,apolice_id,parcela'])
                ->get(),
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

    public function exportar(ExportacaoPagamentoService $exportacaoService)
    {
        return $exportacaoService->exportarPagamentosCsv();
    }
}
