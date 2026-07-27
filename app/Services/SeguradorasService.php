<?php

namespace App\Services;

use App\Models\Seguradora;
use App\Models\Ramo;
use Illuminate\Http\Request;

class SeguradorasService
{

    // Método novo para carregar os dados agrupados
    public function buscarSeguradorasComRamos()
    {
        try {
            return Seguradora::with('ramos')->get();
        } catch (\Exception $e) {
            throw new \Exception('Erro ao buscar seguradoras com ramos: ' . $e->getMessage());
        }
    }

    public function createSeguradora(array $data): void
    {
        $ramo = $data['ramos'] ?? [];
        unset($data['ramos']);

        $seguradora = Seguradora::create($data);

        foreach ($ramo as $nomeRamo) {
            Ramo::create([
                'nome_ramo' => $nomeRamo,
                'seguradora_id' => $seguradora->id
            ]);
        }
    }

    public function count()
    {
        return Seguradora::count();
    }

    public function updateSeguradora(int $id, Request $request)
    {
        try {
            $seguradora = Seguradora::findOrFail($id);
            $seguradora->update($request->all());
        } catch (\Exception $e) {
            throw new \Exception('Erro ao atualizar seguradora: ' . $e->getMessage());
        }
    }

    public function deleteSeguradora(int $id)
    {
        try {
            $seguradora = Seguradora::findOrFail($id);
            $seguradora->delete();
        } catch (\Exception $e) {
            throw new \Exception('Erro ao excluir seguradora: ' . $e->getMessage());
        }
    }

    public function activeInativeSeguradora(int $id)
    {
        try {
            $seguradora = Seguradora::findOrFail($id);

            // Verifica se a seguradora tem apólices vigentes
            $temApolicesVigentes = $seguradora->apolices()
                ->where('status', 'ativa') // ou 'data_fim', '>=', now()
                ->exists();

            $seguradora->ativo = $temApolicesVigentes;
            $seguradora->save();

            return $seguradora;
        } catch (\Exception $e) {
            throw new \Exception('Erro ao atualizar status da seguradora: ' . $e->getMessage());
        }
    }

    public function activeInative(int $id)
    {
        if (Seguradora::has('ramos')->where('id', $id)->exists()) {
            $seguradora = Seguradora::findOrFail($id);
            $seguradora->ativo = !$seguradora->ativo;
        }
    }
}
