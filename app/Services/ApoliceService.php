<?php

namespace App\Services;

use App\Models\Apolices;
use App\Models\Ramo;
use App\Models\Seguradora;
use App\Models\Segurado;

class ApoliceService
{
    protected SeguradorasService $seguradorasService;

    public function __construct(SeguradorasService $seguradorasService)
    {
        $this->seguradorasService = $seguradorasService;
    }

    public function store(array $data)
    {
        try {
            $apolice = Apolices::create($data);

            // Atualiza status da seguradora vinculada
            $this->seguradorasService->activeInativeSeguradora($apolice->seguradora_id);

            return $apolice;
        } catch (\Exception $e) {
            throw new \Exception('Erro ao cadastrar apólice: ' . $e->getMessage());
        }
    }

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

    public function buscarApolices()
    {
        try {
            return Apolices::select(
                'apolices.id',
                'apolices.numero_apolice',
                'apolices.valor_premio_total',
                'apolices.quantidade_parcelas',
                'apolices.inicio_vigencia',
                'apolices.fim_vigencia',
                'apolices.status',
                'segurados.nome_completo',
                'ramos.nome_ramo',
                'seguradoras.nome_fantasia'
            )
                ->join('segurados',   'apolices.cliente_id',    '=', 'segurados.id')
                ->join('ramos',       'apolices.ramo_id',       '=', 'ramos.id')
                ->join('seguradoras', 'apolices.seguradora_id', '=', 'seguradoras.id')
                ->get();
        } catch (\Exception $e) {
            throw new \Exception('Erro ao buscar apólices: ' . $e->getMessage());
        }
    }

    public function destroy(int $id)
    {
        try {
            $apolice = Apolices::findOrFail($id);
            $seguradoraId = $apolice->seguradora_id;

            $apolice->delete();

            // Recalcula o status da seguradora após apagar
            $this->seguradorasService->activeInativeSeguradora($seguradoraId);
        } catch (\Exception $e) {
            throw new \Exception('Erro ao excluir apólice: ' . $e->getMessage());
        }
    }

    public function update(int $id, array $data)
    {
        try {
            $apolice = Apolices::findOrFail($id);
            $seguradoraAntigaId = $apolice->seguradora_id;

            $apolice->update($data);

            // Atualiza status da seguradora (e da antiga se mudou)
            $this->seguradorasService->activeInativeSeguradora($apolice->seguradora_id);
            if ($seguradoraAntigaId !== $apolice->seguradora_id) {
                $this->seguradorasService->activeInativeSeguradora($seguradoraAntigaId);
            }
        } catch (\Exception $e) {
            throw new \Exception('Erro ao atualizar apólice: ' . $e->getMessage());
        }
    }

    public function count()
    {
        try {
            return Apolices::count();
        } catch (\Exception $e) {
            throw new \Exception('Erro ao contar apólices: ' . $e->getMessage());
        }
    }

    public function AlterarRamo(int $apoliceId, int $novoRamoId)
    {
        try {
            $apolice = Apolices::findOrFail($apoliceId);
            $apolice->ramo_id = $novoRamoId;
            $apolice->save();
        } catch (\Exception $e) {
            throw new \Exception('Erro ao alterar o ramo da apólice: ' . $e->getMessage());
        }
    }
}