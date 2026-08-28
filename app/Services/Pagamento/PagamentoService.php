<?php

namespace App\Services\Pagamento;

use Illuminate\Support\Facades\DB;
use App\Models\Pagamento;
use App\Models\Parcelas;

class PagamentoService
{
    public function store(array $data)
    {
        return DB::transaction(function () use ($data) {
            $parcela = Parcelas::where('apolice_id', $data['apolice_id'])
                ->where('numero_parcela', $data['parcela'])
                ->first();

            if (!$parcela) {
                throw new \Exception('Não existe a parcela informada para esta apólice.');
            }

            $pagamento = Pagamento::create($data);

            $parcela->update([
                'status_pagamento' => 'paga',
                'data_pagamento'   => $data['data_pagamento'],
            ]);

            return $pagamento;
        });
    }

    public function count()
    {
        return Pagamento::count();
    }

    public function destroy(int $id)
    {
        try {
            $pagamento = Pagamento::findOrFail($id);
            $pagamento->delete();
        } catch (\Exception $e) {
            throw new \Exception('Erro ao excluir pagamento: ' . $e->getMessage());
        }
    }

    // Todos os pagamentos (de todas as parcelas/apólices) de um mesmo cliente
    public function listarPorCliente(int $clienteId)
    {
        try {
            return Pagamento::with('apolice')
                ->whereHas('apolice', function ($query) use ($clienteId) {
                    $query->where('cliente_id', $clienteId);
                })
                ->orderBy('apolice_id')
                ->orderBy('parcela')
                ->get()
                ->map(function ($pagamento) {
                    return [
                        'id'                          => $pagamento->id,
                        'apolice_id'                  => $pagamento->apolice_id,
                        'apolice'                     => $pagamento->apolice->numero_apolice ?? '—',
                        'apolice_quantidade_parcelas' => $pagamento->apolice->quantidade_parcelas ?? null,
                        'parcela'                     => $pagamento->parcela,
                        'valor'                       => $pagamento->valor,
                        'data_pagamento'              => $pagamento->data_pagamento,
                        'forma_pagamento'             => $pagamento->forma_pagamento,
                        'status'                      => $pagamento->status,
                    ];
                });
        } catch (\Exception $e) {
            throw new \Exception('Erro ao listar pagamentos do cliente: ' . $e->getMessage());
        }
    }
}
