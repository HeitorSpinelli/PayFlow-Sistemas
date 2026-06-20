<?php

namespace App\Services;

use App\Models\Seguradora;
use App\Models\Ramo;
use Illuminate\Http\Request;

class SeguradorasService{

    //Cria uma nova seguradora
    public function createSeguradora(Request $request){
        try {
            Seguradora::create($request->all());
        } catch (\Exception $e) {
            throw new \Exception('Erro ao cadastrar seguradora: ' . $e->getMessage());
        }
    }

    //Contagem total de seguradoras
    public function count()
    {
        return Seguradora::count();
    }

    //Atualiza a seguradora 
    public function updateSeguradora(int $id, Request $request){
        try {
            $seguradora = Seguradora::findOrFail($id);
            $seguradora->update($request->all());
        } catch (\Exception $e) {
            throw new \Exception('Erro ao atualizar seguradora: ' . $e->getMessage());
        }
    }

    //Exclui a seguradora apenas se não tiver ramos associados
    public function deleteSeguradora(int $id){
        try {
            $seguradora = Seguradora::findOrFail($id);
            $seguradora->delete();
        } catch (\Exception $e) {
            throw new \Exception('Erro ao excluir seguradora: ' . $e->getMessage());
        }
    }

    //Verifica se a seguradora tem ramos associados antes de ativar/inativar
    public function activeInative(int $id)
    {
        if (Seguradora::has('ramos')->where('id', $id)->exists()) {
            $seguradora = Seguradora::findOrFail($id);
            $seguradora->ativo = !$seguradora->ativo;
        }
    }
}