<?php

namespace App\Http\Controllers;

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

    public function show()
    {
        $pagamentos = pagamento::with('apolice.cliente')->get()->map(function ($pagamento) {
            return [
                'id' => $pagamento->id,
                'cliente' => $pagamento->apolice->cliente->nome_completo ?? '—',
                'apolice' => $pagamento->apolice->numero_apolice ?? '—',
                'parcela' => $pagamento->parcela,
                'valor' => $pagamento->valor,
                'data_pagamento' => $pagamento->data_pagamento,
                'forma_pagamento' => $pagamento->forma_pagamento,
                'status' => $pagamento->status,
            ];
        });

        return inertia('FunctionsApp/pagamentos', [
            'pagamentos' => $pagamentos,
            'totalRecebido' => pagamento::where('status', 'confirmado')->sum('valor'),
            'totalRegistrado' => pagamento::sum('valor'),
            'totalConfirmados' => pagamento::where('status', 'confirmado')->count(),
            'totalPendentes' => pagamento::where('status', 'pendente')->count(),
            'segurados' => segurado::select('id', 'nome_completo', 'cpf_cnpj')->get(),
            'apolices' => Apolice::select('id', 'numero_apolice', 'cliente_id')->get(),
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