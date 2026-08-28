<?php

namespace App\Services\Cliente;

use App\Models\Apolice;
use App\Models\Segurado;
use App\Services\Apolice\ApoliceService;
use Illuminate\Support\Facades\DB;

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
            DB::transaction(function () use ($id) {
                $segurado = Segurado::findOrFail($id);
            foreach ($segurado->apolices as $apolice) {
                $this->apolice_service->destroy($apolice->id);
            }
            $segurado->delete();
            });
        } catch (\Exception $e) {
            throw new \Exception('Erro ao excluir segurado: ' . $e->getMessage());
        }
    }

    public function update(int $id, array $data)
    {
        try {
            unset($data['cpf_cnpj']);
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
            DB::transaction(function () use ($id) {
                $segurado = Segurado::withTrashed()->findOrFail($id);
            $segurado->restore();
            $apolices = $segurado->apolices()->onlyTrashed()->get();
            foreach($apolices as $apolice) {
                $this->apolice_service->restore($apolice->id);
            }
            });
        } catch (\Exception $e) {
            throw new \Exception('Erro ao restaurar segurado: ' . $e->getMessage());
        }
    }
}
