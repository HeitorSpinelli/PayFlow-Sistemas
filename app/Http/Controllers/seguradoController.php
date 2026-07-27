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
    public function store(StoreSeguradoRequest $request)
    {

        $data = $request->validated();
        $this->seguradoService->store($data);
        return redirect()->back()->with('success', 'Segurado cadastrado com sucesso!');
    }

    public function show()
    {
        // 1. Pagina os segurados (15 por página) carregando as apólices
        $segurados = Segurado::with('apolices')->latest()->paginate(10);

        // 2. Conta rápida no banco para o card "Total" (não carrega registros na memória)
        $total = Segurado::count();

        // 3. Conta rápida no banco apenas dos inativos (retorna só um NÚMERO em vez de 650 objetos)
        $totalInativos = Segurado::whereDoesntHave('apolices')->count();

        return inertia('FunctionsApp/clientes', [
            'segurados'     => $segurados,
            'total'         => $total,
            'totalInativos' => $totalInativos,
        ]);
    }

    public function destroy(int $id)
    {
        try {
            $this->seguradoService->destroy($id);
            return redirect()->back()->with('success', 'Segurado excluído com sucesso!');
        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'Erro ao excluir segurado: ' . $e->getMessage());
        }
    }
    public function update(UpdateSeguradoRequest $request, int $id)
    {
        try {
            $data = $request->validated();
            $this->seguradoService->update($id, $data);
            return redirect()->back()->with('success', 'Segurado atualizado com sucesso!');
        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'Erro ao atualizar segurado: ' . $e->getMessage());
        }
    }
}
