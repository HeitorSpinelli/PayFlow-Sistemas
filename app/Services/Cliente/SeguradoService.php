<?php

namespace App\Services\Cliente;

use App\Models\Apolice;
use App\Models\Segurado;
use App\Services\Apolice\ApoliceService;
use Illuminate\Support\Facades\DB;

class SeguradoService
{
    private const MESES_ABREV = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

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
                foreach ($apolices as $apolice) {
                    $this->apolice_service->restore($apolice->id);
                }
            });
        } catch (\Exception $e) {
            throw new \Exception('Erro ao restaurar segurado: ' . $e->getMessage());
        }
    }

    /**
     * Quantidade de clientes ativos (com apólice vigente) em cada um
     * dos últimos $meses meses. Para meses já encerrados, verifica quem
     * estava ativo no ÚLTIMO DIA daquele mês. Para o mês atual (ainda em
     * andamento), usa a data de hoje como referência — mesmo padrão que
     * receitaDoMes() já usa para o mês corrente ser "parcial".
     */
    public function clientesAtivosUltimosMeses(int $meses = 6): array
    {
        $resultado = [];

        for ($i = $meses - 1; $i >= 0; $i--) {
            $dataReferencia = $i === 0
                ? now()
                : now()->copy()->startOfMonth()->subMonths($i)->endOfMonth();

            $total = Segurado::whereHas('apolices', function ($q) use ($dataReferencia) {
                $q->ativas($dataReferencia);
            })->count();

            $resultado[] = [
                'mes' => self::MESES_ABREV[$dataReferencia->month - 1],
                'total' => $total,
            ];
        }

        return $resultado;
    }
}
