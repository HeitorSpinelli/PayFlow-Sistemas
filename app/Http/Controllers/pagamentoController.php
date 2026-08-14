<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Http\Requests\StorePagamentoRequest;
use App\Models\pagamento;
use App\Models\segurado;
use App\Models\Apolice;
use App\Services\Pagamento\PagamentoService;

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
        $this->pagamentoService->store($data);
        return redirect()->back()->with('success', 'Pagamento registrado com sucesso!');
    }

    public function show(Request $request)
    {
        $pagamentos = Pagamento::with('apolice.cliente')
            ->filter($request->all())
            ->paginate(10)
            ->withQueryString()
            ->through(function ($pagamento) {
                return [
                    'id' => $pagamento->id,
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
            'totalRecebido' => Pagamento::sum('valor'),
            'totalConfirmados' => Pagamento::count(),
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
            return redirect()->back()->with('error', 'Erro ao excluir pagamento: ' . $e->getMessage());
        }
    }
}
