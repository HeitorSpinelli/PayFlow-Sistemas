<?php

namespace App\Services\Cliente;

use App\Models\Ramo;

class RamoService
{
    public function show(int $id)
    {
        return Ramo::findOrFail($id);
    }

    public function create(array $data)
    {
        try {
            Ramo::create($data);
        } catch (\Exception $e) {
            throw new \Exception('Erro ao cadastrar ramo: ' . $e->getMessage());
        }
    }
}