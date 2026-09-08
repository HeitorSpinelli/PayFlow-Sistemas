<?php

namespace App\Services\Pagamento;

use App\Models\Pagamento;
use App\Models\Parcelas;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class PagamentoService
{
    public function store(array $data)
    {
        return DB::transaction(function () use ($data) {
            $parcela = Parcelas::where('apolice_id', $data['apolice_id'])
                ->where('numero_parcela', $data['parcela'])
                ->first();

            if (! $parcela) {
                throw new \Exception('Não existe a parcela informada para esta apólice.');
            }

            $pagamento = Pagamento::create($data);

            $parcela->update([
                'status_pagamento' => 'paga',
                'data_pagamento' => $data['data_pagamento'],
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
            DB::transaction(function () use ($id) {
                $pagamento = Pagamento::findOrFail($id);

                // Reabre a parcela — sem isso ela fica "paga" pra sempre mesmo
                // sem nenhum pagamento associado, e a constraint de unicidade
                // (apolice_id, parcela) impediria registrar outro pagamento nela
                Parcelas::where('apolice_id', $pagamento->apolice_id)
                    ->where('numero_parcela', $pagamento->parcela)
                    ->update([
                        'status_pagamento' => 'em_aberto',
                        'data_pagamento' => null,
                    ]);

                $pagamento->delete();
            });
        } catch (\Exception $e) {
            Log::error('Erro ao excluir pagamento', ['id' => $id, 'erro' => $e->getMessage()]);
            throw new \Exception('Não foi possível excluir o pagamento. Tente novamente ou contate o suporte.');
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
