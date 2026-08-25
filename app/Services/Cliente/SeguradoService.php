<?php

namespace App\Services\Cliente;

use App\Models\Apolice;
use App\Models\Segurado;
use App\Services\Apolice\ApoliceService;

class SeguradoService
{

    protected ApoliceService $apolice_service;

    public function __construct(ApoliceService $apolice_service)
    {
        $this->apolice_service = $apolice_service;
    }

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
            foreach ($segurado->apolices as $apolice) {
                $apolice->delete();
            }
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

    //Listando apenas clientes que estão com deleted at 
    public function listarInativos()
    {
        return Segurado::onlyTrashed()->get();
    }

    //Restaura o segurado pelo id
    public function restore(int $id)
    {
        try {
            $segurado = Segurado::withTrashed()->findOrFail($id);
            $segurado->restore();
            $apolices = $segurado->apolices()->withTrashed()->get();
            foreach($apolices as $apolice) {
                $apolice->restore();
            }
        } catch (\Exception $e) {
            throw new \Exception('Erro ao restaurar segurado: ' . $e->getMessage());
        }
    }
}
