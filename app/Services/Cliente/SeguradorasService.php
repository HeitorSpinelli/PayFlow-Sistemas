<?php

namespace App\Services\Cliente;

use App\Models\Ramo;
use App\Models\Seguradora;
use Illuminate\Database\QueryException;

class SeguradorasService
{
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
        // Usa o id da seguradora recém criada como chave estrangeira.
        // Cada item agora traz também a categoria (veiculo/residencial/outro),
        // que decide quais dados extras a apólice desse ramo vai exigir.
        foreach ($ramo as $itemRamo) {
            Ramo::create([
                'nome_ramo' => $itemRamo['nome_ramo'],
                'categoria' => $itemRamo['categoria'],
                'seguradora_id' => $seguradora->id,
            ]);
        }
    }

    // Contagem total de seguradoras
    public function count()
    {
        return Seguradora::count();
    }

    // Atualiza a seguradora
    public function updateSeguradora(int $id, array $data): void
    {
        try {
            $seguradora = Seguradora::findOrFail($id);

            // Se houver lógica de ramos no update também, você pode tratá-la aqui igual no create.
            $seguradora->update($data);
        } catch (\Exception $e) {
            throw new \Exception('Erro ao atualizar seguradora: '.$e->getMessage());
        }
    }

    /**
     * apolices.seguradora_id tem FK com ON DELETE RESTRICT — o próprio banco
     * recusa apagar uma seguradora que ainda tem apólice vinculada (os ramos
     * dela, em compensação, têm CASCADE e seriam apagados junto). Captura o
     * erro específico (SQLSTATE 23503, violação de chave estrangeira) e
     * devolve uma mensagem que faz sentido pro usuário, em vez do erro de
     * SQL cru (mesmo tratamento já usado em RamoService::delete()).
     */
    public function deleteSeguradora(int $id)
    {
        try {
            Seguradora::findOrFail($id)->delete();
        } catch (QueryException $e) {
            if ($e->getCode() === '23503') {
                throw new \Exception('Não é possível excluir: já existem apólices cadastradas com esta seguradora.');
            }

            throw new \Exception('Erro ao excluir seguradora: '.$e->getMessage());
        } catch (\Exception $e) {
            throw new \Exception('Erro ao excluir seguradora: '.$e->getMessage());
        }
    }

    // Verifica se a seguradora tem ramos associados antes de ativar/inativar
    public function activeInative(int $id)
    {
        if (Seguradora::has('ramos')->where('id', $id)->exists()) {
            $seguradora = Seguradora::findOrFail($id);
            $seguradora->ativo = ! $seguradora->ativo;
        }
    }

    public function getAllSeguradoras()
    {
        // Traz as seguradoras e os ramos relacionados (relacionamento 'ramos')
        return Seguradora::with('ramos')->get();
    }
}
