<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Services\ApoliceService;
use App\Models\apolices;
use Illuminate\Http\Request;

class ApolicesController extends Controller
{
    protected ApoliceService $apoliceService;

    public function __construct(ApoliceService $apoliceService)
    {
        $this->apoliceService = $apoliceService;
    }

    public function index()
    {
        return inertia('FunctionsApp/apolices', [
            'apolices'    => $this->apoliceService->buscarApolices(),
            'segurados'   => $this->apoliceService->buscar(),
            'seguradoras' => $this->apoliceService->buscarSeguradoras(),
            'ramos'       => $this->apoliceService->buscarRamos(),
        ]);
    }

    public function store(Request $request)
    {
        try {
            $this->apoliceService->store($request->all());
            return redirect()->back()->with('success', 'Apólice cadastrada com sucesso!');
        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'Erro ao cadastrar apólice: ' . $e->getMessage());
        }
    }

    public function show(int $id){

    $query = apolices::query();

    $apolices = $query->orderBy('id')->paginate(10)->withQueryString();

    $total = apolices::count();

    $totalAtivos = apolices::where('fim_vigencia', '>=', now()->today())->count();
    
    }

    public function status(int $id){
        $query = apolices::query();


    }

    public function update(int $id, Request $request)
    {
        try {
            $this->apoliceService->update($id, $request->all());
            return redirect()->back()->with('success', 'Apólice atualizada com sucesso!');
        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'Erro ao atualizar apólice: ' . $e->getMessage());
        }
    }

    public function destroy(int $id)
    {
        try {
            $this->apoliceService->destroy($id);
            return redirect()->back()->with('success', 'Apólice excluída com sucesso!');
        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'Erro ao excluir apólice: ' . $e->getMessage());
        }
    }

    public function atualizarRamo(int $id, Request $request)
    {
        try {
            $this->apoliceService->AlterarRamo($id, $request->input('ramo_id'));
            return redirect()->back()->with('success', 'Ramo da apólice alterado com sucesso!');
        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'Erro ao alterar ramo: ' . $e->getMessage());
        }
    }
}