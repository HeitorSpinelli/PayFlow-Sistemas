<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreSeguradoraRequest;
use App\Services\Cliente\SeguradorasService;
use Illuminate\Http\Request;

class SeguradoraController extends Controller
{

    protected SeguradorasService $seguradorasService;

    public function __construct(SeguradorasService $seguradorasService)
    {
        $this->seguradorasService = $seguradorasService;
    }

    public function index()
    {
        $seguradoras = $this->seguradorasService->getAllSeguradoras();

        return inertia('FunctionsApp/seguradoras', [
            'seguradoras' => $seguradoras
        ]);
    }

    public function store(StoreSeguradoraRequest $request)
    {
        try {
            $this->seguradorasService->createSeguradora($request->validated());
            return redirect()->back()->with('success', 'Seguradora cadastrada com sucesso!');
        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'Erro ao cadastrar seguradora: ' . $e->getMessage());
        }
    }

    public function count()
    {
        try {
            $count = $this->seguradorasService->count();
            return redirect()->back()->with('success', "Total de seguradoras: $count");
        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'Erro ao contabilizar seguradoras: ' . $e->getMessage());
        }
    }

    public function update(Request $request, int $id)
    {
        try {
            // Passa apenas o array de dados validados
            $this->seguradorasService->updateSeguradora($id, $request->all());
            return redirect()->back()->with('success', 'Seguradora atualizada com sucesso!');
        } catch (\Exception $e) {
            return redirect()->back()->with('error', $e->getMessage());
        }
    }

    public function destroy(int $id)
    {
        try {
            $this->seguradorasService->deleteSeguradora($id);
            return redirect()->back()->with('success', 'Seguradora excluída com sucesso!');
        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'Erro ao excluir seguradora: ' . $e->getMessage());
        }
    }
}
