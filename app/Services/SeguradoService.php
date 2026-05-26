<?php

namespace App\Services;

use App\Models\Segurado;

class SeguradoService
{
    public function store(array $data)
    {
        try {
            Segurado::create($data);
        } 
        catch (\Exception $e) {
            throw new \Exception('Erro ao cadastrar segurado: ' . $e->getMessage());
        }
    }

     public function show()
    {
        $segurados = Segurado::all();
        
        return inertia('FunctionsApp/clientes', [
            'segurados' => $segurados,
        ]);
    }
}