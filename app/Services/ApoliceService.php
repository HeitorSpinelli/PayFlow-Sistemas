<?php

namespace App\Services;

use App\Models\Apolice; // Padronizado para o singular
use App\Models\Ramo;
use App\Models\Seguradora;
use App\Models\Segurado;
use Illuminate\Http\Request;

class ApoliceService
{
    protected SeguradorasService $seguradorasService;

    public function __construct(SeguradorasService $seguradorasService)
    {
        $this->seguradorasService = $seguradorasService;
    }

    /**
     * Responsável por filtrar, paginar e buscar dados auxiliares para a tela de apólices.
     */
    public function filtrarEListar(Request $request)
    {
        $query = Apolice::with(['cliente', 'ramo', 'seguradora']);

        // Filtro de Busca (Número da Apólice ou Nome do Cliente)
        if ($request->filled('busca')) {
            $busca = trim($request->input('busca'));
            $buscaNumeros = preg_replace('/\D/', '', $busca);

            $query->where(function ($q) use ($busca, $buscaNumeros) {
                if (!empty($buscaNumeros)) {
                    $q->where('numero_apolice', 'iLIKE', "%{$buscaNumeros}%");
                }

                $q->orWhereHas('cliente', function ($subQ) use ($busca) {
                    $subQ->where('nome_completo', 'iLIKE', "%{$busca}%");
                });
            });
        }

        // Filtro de Status unificado por data
        if ($request->filled('status')) {
            $status = $request->input('status');

            if ($status === 'Renovadas' || $status === 'Renovada') {
                $query->where('fim_vigencia', '>=', now()->today());
            } elseif ($status === 'Vencidas') {
                $query->where('fim_vigencia', '<', now()->today());
            }
        }

        return [
            'apolices'       => $query->orderBy('id')->paginate(10)->withQueryString(),
            'total'          => Apolice::count(),
            'totalRenovadas' => Apolice::where('fim_vigencia', '>=', now()->today())->count(),
            'totalVencidas'  => Apolice::where('fim_vigencia', '<', now()->today())->count(),
            'segurados'      => $this->buscar(),
            'seguradoras'    => $this->buscarSeguradoras(),
            'ramos'          => $this->buscarRamos(),
        ];
    }

    public function store(array $data)
    {
        try {
            $apolice = Apolice::create($data);

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

    public function destroy(int $id)
    {
        try {
            $apolice = Apolice::findOrFail($id);
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
            $apolice = Apolice::findOrFail($id);
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
            return Apolice::count();
        } catch (\Exception $e) {
            throw new \Exception('Erro ao contar apólices: ' . $e->getMessage());
        }
    }

    public function alterarRamo(int $apoliceId, int $novoRamoId) // Ajustado para camelCase
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