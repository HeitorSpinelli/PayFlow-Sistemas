<?php

namespace App\Services\Cliente;

use App\Models\Ramo;
use Illuminate\Database\QueryException;

/**
 * Regras de ramos de seguradora (CRUD). Usado por RamosController, ou seja,
 * pela seção de ramos do modal de perfil da seguradora (tela Seguradoras).
 */
class RamoService
{
    /**
     * Busca um ramo pelo id. Só RamosController::show() usa, e não há rota para ele.
     */
    public function show(int $id)
    {
        return Ramo::findOrFail($id);
    }

    /**
     * Cria um ramo — botão de adicionar ramo no modal de perfil da seguradora.
     */
    public function create(array $data)
    {
        try {
            Ramo::create($data);
        } catch (\Exception $e) {
            throw new \Exception('Erro ao cadastrar ramo: '.$e->getMessage());
        }
    }

    /**
     * Atualiza nome/categoria do ramo — edição de ramo no modal de perfil da seguradora.
     */
    public function update(int $id, array $data): void
    {
        try {
            $ramo = Ramo::findOrFail($id);
            $ramo->update($data);
        } catch (\Exception $e) {
            throw new \Exception('Erro ao atualizar ramo: '.$e->getMessage());
        }
    }

    /**
     * apolices.ramo_id tem FK com ON DELETE RESTRICT — o próprio banco recusa
     * apagar um ramo que ainda tem apólice vinculada. Captura esse erro
     * específico (SQLSTATE 23503, violação de chave estrangeira) e devolve
     * uma mensagem que faz sentido pro usuário, em vez do erro de SQL cru.
     *
     * Usado pela lixeira de ramo no modal de perfil da seguradora; a mensagem da
     * exceção vira o toast de erro.
     */
    public function delete(int $id): void
    {
        try {
            Ramo::findOrFail($id)->delete();
        } catch (QueryException $e) {
            if ($e->getCode() === '23503') {
                throw new \Exception('Não é possível excluir: já existem apólices cadastradas com este ramo.');
            }

            throw new \Exception('Erro ao excluir ramo: '.$e->getMessage());
        } catch (\Exception $e) {
            throw new \Exception('Erro ao excluir ramo: '.$e->getMessage());
        }
    }
}
