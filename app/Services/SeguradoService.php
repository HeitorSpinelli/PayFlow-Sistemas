<?php

namespace App\Services;

use App\Models\Segurado;

class SeguradoService
{
    public function store(array $data)
    {
        try {

            //Define o valor do segurado existente como o valor retornado pela consulta ao banco de dados, buscando por um registro com o mesmo CPF/CNPJ que não esteja excluído
            $seguradoExistente = Segurado::withoutTrashed()
                ->where('cpf_cnpj', $data['cpf_cnpj'])
                //First é usado para retornar o primeiro registro encontrado, caso exista algum registro com o mesmo CPF/CNPJ
                ->first();

            //Se o segurado existente for um que tenha sido excluído, ele será restaurado e atualizado com os novos dados recebidos
            if ($seguradoExistente->trashed()) {
                $seguradoExistente->restore();

                //Se o segurado existente for um que tenha sido excluído, ele será restaurado e atualizado com os novos dados recebidos
                $seguradoExistente->update($data);
                return $seguradoExistente;
            }

            return Segurado::create($data);
        } catch (\Exception $e) {
            throw new \Exception('Erro ao criar ou reativar segurado: ' . $e->getMessage());
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
