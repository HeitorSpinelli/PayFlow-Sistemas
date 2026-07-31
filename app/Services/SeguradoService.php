<?php

namespace App\Services;

use App\Models\Segurado;

class SeguradoService
{
    public function store(array $data)
    {
        try {
            Segurado::create($data);
        } catch (\Exception $e) {
            throw new \Exception('Erro ao cadastrar segurado: ' . $e->getMessage());
        }
    }

    public function count()
    {
        return Segurado::count();
    }

    public function destroy(int $id)
    {
        try {
            $segurado = Segurado::findOrFail($id);
            $segurado->delete();
        } catch (\Exception $e) {
            throw new \Exception('Erro ao excluir segurado: ' . $e->getMessage());
        }
    }

    public function update(int $id, array $data)
    {
        try {
            $segurado = Segurado::findOrFail($id);
            $segurado->update($data);
        } catch (\Exception $e) {
            throw new \Exception('Erro ao atualizar segurado: ' . $e->getMessage());
        }
    }
}
