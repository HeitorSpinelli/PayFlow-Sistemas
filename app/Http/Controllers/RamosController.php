<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreRamoRequest;
use App\Http\Requests\UpdateRamoRequest;
use App\Services\Cliente\RamoService;

/**
 * CRUD de ramos de uma seguradora já cadastrada — usado na seção de ramos do
 * modal de perfil da seguradora (create-profileSeguradora-modal.tsx), tela
 * Seguradoras. Só admin.
 */
class RamosController extends Controller
{
    private RamoService $ramoService;

    public function __construct(RamoService $ramoService)
    {
        $this->ramoService = $ramoService;
    }

    // Ramo de cada contrato de seguro, como automóvel, residencial, vida, empresarial, etc.
    /**
     * Adiciona um ramo novo à seguradora pelo modal de perfil da seguradora.
     */
    public function store(StoreRamoRequest $request)
    {
        try {
            $this->ramoService->create($request->validated());

            return redirect()->back()->with('success', 'Ramo cadastrado com sucesso!');
        } catch (\Exception $e) {
            return redirect()->back()->with('error', $e->getMessage());
        }
    }

    /**
     * Devolve um ramo pelo id. Não existe rota apontando para este método hoje.
     */
    public function show(int $id)
    {
        return $this->ramoService->show($id);
    }

    /**
     * Salva a edição de nome/categoria de um ramo no modal de perfil da seguradora.
     */
    public function update(UpdateRamoRequest $request, int $id)
    {
        try {
            $this->ramoService->update($id, $request->validated());

            return redirect()->back()->with('success', 'Ramo atualizado com sucesso!');
        } catch (\Exception $e) {
            return redirect()->back()->with('error', $e->getMessage());
        }
    }

    /**
     * Exclui um ramo pelo modal de perfil da seguradora; recusa com toast de erro
     * se houver apólice usando o ramo.
     */
    public function destroy(int $id)
    {
        try {
            $this->ramoService->delete($id);

            return redirect()->back()->with('success', 'Ramo excluído com sucesso!');
        } catch (\Exception $e) {
            return redirect()->back()->with('error', $e->getMessage());
        }
    }
}
