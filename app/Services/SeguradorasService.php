<?php

namespace App\Services;

use App\Models\Seguradora;
use App\Models\Ramo;
use Illuminate\Http\Request;

class SeguradorasService{

    // SeguradorasService.php

    public function createSeguradora(array $data): void
    {
        // 1. Separa os ramos do resto dos dados
        // Usa o array_key_exists para verificar se veio ramos no formulário
        $ramo = $data['ramos'] ?? [];

        // 2. Remove os ramos do array antes de criar a seguradora
        // A tabela seguradoras não tem coluna 'ramos', então não pode ir junto
        unset($data['ramos']);

        // 3. Cria a seguradora e guarda o objeto retornado
        // O create() retorna o objeto com o id gerado pelo banco
        $seguradora = Seguradora::create($data);

        // 4. Para cada ramo da lista, cria um registro na tabela ramos
        // Usa o id da seguradora recém criada como chave estrangeira
        foreach ($ramo as $nomeRamo) {
            Ramo::create([
                'nome_ramo' => $nomeRamo,
                'seguradora_id' => $seguradora->id
            ]);
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