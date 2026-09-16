<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreRamoRequest;
use App\Http\Requests\UpdateRamoRequest;
use App\Services\Cliente\RamoService;

class RamosController extends Controller
{
    private RamoService $ramoService;

    public function __construct(RamoService $ramoService)
    {
        $this->ramoService = $ramoService;
    }

    // Ramo de cada contrato de seguro, como automóvel, residencial, vida, empresarial, etc.
    public function store(StoreRamoRequest $request)
    {
        try {
            $this->ramoService->create($request->validated());

            return redirect()->back()->with('success', 'Ramo cadastrado com sucesso!');
        } catch (\Exception $e) {
            return redirect()->back()->with('error', $e->getMessage());
        }
    }

    public function show(int $id)
    {
        return $this->ramoService->show($id);
    }

    public function update(UpdateRamoRequest $request, int $id)
    {
        try {
            $this->ramoService->update($id, $request->validated());

            return redirect()->back()->with('success', 'Ramo atualizado com sucesso!');
        } catch (\Exception $e) {
            return redirect()->back()->with('error', $e->getMessage());
        }
    }

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
