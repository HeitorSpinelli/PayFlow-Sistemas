<?php

namespace App\Services\Apolice;

use App\Models\Seguradora;
use App\Models\Segurado;
use App\Models\Ramo;
use App\Models\Apolice;

class ApoliceService
{

    public function store(array $data)
    {
        //Tenta salvar a apolice. Se der erro ele pega a mensagem de erro e joga uma nova exceção com a mensagem personalizada
        try {
            Apolice::create($data);
        } catch (\Exception $e) {
            throw new \Exception('Erro ao cadastrar apólice: ' . $e->getMessage());
        }
    }
    //Função para buscar os segurados cadastrados no banco, selecionando apenas os campos id, nome_completo e cpf_cnpj
    public function buscar()
    {
        try {
            return Segurado::select('id', 'nome_completo', 'cpf_cnpj')->get();
        } catch (\Exception $e) {
            throw new \Exception('Erro ao buscar segurados: ' . $e->getMessage());
        }
    }
    public function buscarSeguradoras()
    {
        try {
            return Seguradora::select('id', 'nome_fantasia')->get();
        } catch (\Exception $e) {
            throw new \Exception('Erro ao buscar seguradoras: ' . $e->getMessage());
        }
    }
    public function buscarRamos()
    {
        try {
            return Ramo::select('id', 'nome_ramo', 'seguradora_id')->get();
        } catch (\Exception $e) {
            throw new \Exception('Erro ao buscar ramos: ' . $e->getMessage());
        }
    }
    public function buscarApolices(array $filters = [])
    {
        try {
            $query = Apolice::query()
                ->join('segurados',   'apolices.cliente_id',    '=', 'segurados.id')
                ->join('ramos',       'apolices.ramo_id',       '=', 'ramos.id')
                ->join('seguradoras', 'apolices.seguradora_id', '=', 'seguradoras.id')
                ->select(
                    'apolices.id',
                    'apolices.numero_apolice',
                    'apolices.valor_premio_total',
                    'apolices.quantidade_parcelas',
                    'apolices.inicio_vigencia',
                    'apolices.fim_vigencia',
                    'apolices.status',
                    'segurados.nome_completo',
                    'segurados.cpf_cnpj',
                    'ramos.nome_ramo',
                    'seguradoras.nome_fantasia'
                );

            if (!empty($filters['busca'])) {
                $termo = $filters['busca'];

                $query->where(function ($q) use ($termo) {
                    // Busca na própria apólice
                    $q->where('apolices.numero_apolice', 'ilike', "%{$termo}%")
                        // Ou busca direto no cliente dono da apólice usando a relação e o ilike do Postgres
                        ->orWhereHas('cliente', function ($qCliente) use ($termo) {
                            $qCliente->where('nome_completo', 'ilike', "%{$termo}%")
                                ->orWhere('cpf_cnpj', 'ilike', "%{$termo}%");
                        })
                        // Ou nos ramos e seguradoras
                        ->orWhere('ramos.nome_ramo', 'ilike', "%{$termo}%")
                        ->orWhere('seguradoras.nome_fantasia', 'ilike', "%{$termo}%");
                });
            }

            if (!empty($filters['status']) && $filters['status'] !== 'Todos') {
                $query->where('apolices.status', $filters['status']);
            }

            return $query->get();
        } catch (\Exception $e) {
            throw new \Exception('Erro ao buscar apólices: ' . $e->getMessage());
        }
    }
    public function destroy(int $id)
    {
        try {
            $apolice = Apolice::findOrFail($id);
            $apolice->delete();
        } catch (\Exception $e) {
            throw new \Exception('Erro ao excluir apólice: ' . $e->getMessage());
        }
    }
    public function update(int $id, array $data)
    {
        try {
            $apolice = Apolice::findOrFail($id);
            $apolice->update($data);
        } catch (\Exception $e) {
            throw new \Exception('Erro ao atualizar apólice: ' . $e->getMessage());
        }
    }
    //Função para contar o total de apolices cadastradas no banco
    public function count()
    {
        try {
            return Apolice::count();
        } catch (\Exception $e) {
            throw new \Exception('Erro ao contar apólices: ' . $e->getMessage());
        }
    }
    public function AlterarRamo(int $apoliceId, int $novoRamoId)
    {
        try {
            $apolice = Apolice::findOrFail($apoliceId);
            $apolice->ramo_id = $novoRamoId;
            $apolice->save();
        } catch (\Exception $e) {
            throw new \Exception('Erro ao alterar o ramo da apólice: ' . $e->getMessage());
        }
    }
}
