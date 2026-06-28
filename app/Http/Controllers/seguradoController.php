<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreSeguradoRequest;
use App\Http\Requests\UpdateSeguradoRequest;
use App\Models\Segurado;
use App\Services\SeguradoService;


class SeguradoController extends Controller
{
    //1. Declaração do service como propriedade
    protected SeguradoService $seguradoService;

    //2. Injeta pelo construtor
    public function __construct(SeguradoService $seguradoService)
    {
        $this->seguradoService = $seguradoService;
    }

    //3. Usa no store
    public function store(StoreSeguradoRequest $request){

        $data = $request->validated();
        $this->seguradoService->store($data);
        return redirect()->back()->with('success', 'Segurado cadastrado com sucesso!');
    }

    public function show()
    {
        // Cada segurado aqui dentro agora terá a propriedade 'status' anexada automaticamente
        $segurados = Segurado::with('apolices')->get();
        $total = Segurado::count();
        $seguradosinativos = Segurado::whereDoesntHave('apolices')->get();
        
        return inertia('FunctionsApp/clientes', [
            'segurados' => $segurados,
            'total' => $total,
            'seguradosinativos' => $seguradosinativos,
        ]);
    }

    public function destroy(int $id){
        try {
            $this->seguradoService->destroy($id);
            return redirect()->back()->with('success', 'Segurado excluído com sucesso!');
        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'Erro ao excluir segurado: ' . $e->getMessage());
        }
    }
    public function update(UpdateSeguradoRequest $request, int $id){
        try {
            $data = $request->validated();
            $this->seguradoService->update($id, $data);
            return redirect()->back()->with('success', 'Segurado atualizado com sucesso!');
        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'Erro ao atualizar segurado: ' . $e->getMessage());
        }
    }
}