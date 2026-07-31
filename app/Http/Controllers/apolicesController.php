<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Services\ApoliceService;
use Illuminate\Http\Request;

class ApolicesController extends Controller
{
    protected ApoliceService $apoliceService;

    public function __construct(ApoliceService $apoliceService)
    {
        $this->apoliceService =$apoliceService;
    }

    /**
     * Exibe a listagem de apólices com paginação, filtros e dados auxiliares.
     */
    public function index(Request $request)
    {
        //toda a lógica pesada de busca e filtros para o Service
        $dados = $this->apoliceService->filtrarEListar($request);

        return inertia('FunctionsApp/apolices', $dados);
    }

    /**
     * Cadastra uma nova apólice.
     */
    public function store(Request $request)
    {
        try {
            // Nota: Se você estiver usando FormRequest (ex: StoreApoliceRequest), 
            // basta substituir Request por StoreApoliceRequest nos parâmetros.
            $this->apoliceService->store($request->all());
            return redirect()->back()->with('success', 'Apólice cadastrada com sucesso!');
        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'Erro ao cadastrar apólice: ' . $e->getMessage());
        }
    }

    /**
     * Atualiza uma apólice existente.
     */
    public function update(Request $request, int$id)
    {
        try {
            $this->apoliceService->update($id,$request->all());
            return redirect()->back()->with('success', 'Apólice atualizada com sucesso!');
        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'Erro ao atualizar apólice: ' . $e->getMessage());
        }
    }

    
    //Exclui uma apólice.
    
    public function destroy(int $id)
    {
        try {
            $this->apoliceService->destroy($id);
            return redirect()->back()->with('success', 'Apólice excluída com sucesso!');
        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'Erro ao excluir apólice: ' . $e->getMessage());
        }
    }

    public function atualizarRamo(Request $request, int $id)
    {
        try {
            // Passamos apenas o ID do ramo extraído do request
            $this->apoliceService->alterarRamo($id, $request->input('ramo_id'));
            return redirect()->back()->with('success', 'Ramo atualizado com sucesso!');
        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'Erro ao atualizar ramo: ' . $e->getMessage());
        }
    }
}