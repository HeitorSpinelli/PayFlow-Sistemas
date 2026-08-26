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
}
