<?php

namespace App\Services;

use App\Models\pagamento;

class PagamentoService
{
    public function store(array $data)
    {
        try {
            pagamento::create($data);
        }
        catch (\Exception $e) {
            throw new \Exception('Erro ao registrar pagamento: ' . $e->getMessage());
        }
    }

    public function count()
    {
        return pagamento::count();
    }

    public function destroy(int $id)
    {
        try {
            $pagamento = pagamento::findOrFail($id);
            $pagamento->delete();
        }
        catch (\Exception $e) {
            throw new \Exception('Erro ao excluir pagamento: ' . $e->getMessage());
        }
    }

    public function update(int $id, array $data)
    {
        try {
            $pagamento = pagamento::findOrFail($id);
            $pagamento->update($data);
        }
        catch (\Exception $e) {
            throw new \Exception('Erro ao atualizar pagamento: ' . $e->getMessage());
        }
    }
}