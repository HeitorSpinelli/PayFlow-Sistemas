<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreSeguradoRequest;
use App\Http\Requests\UpdateSeguradoRequest;
use Illuminate\Http\Request;
use App\Models\Segurado;
use App\Services\Cliente\SeguradoService;
use App\Services\Exportacoes\ExportacaoSeguradosService;

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

    public function show(Request $request)
    {
        $segurados = Segurado::with('apolices')
            ->filter($request->all())
            ->paginate(10)
            ->withQueryString();

        $total = Segurado::count();
        $totalAtivos = Segurado::has('apolices')->count();
        $totalInativos = Segurado::doesntHave('apolices')->count();

        return inertia('FunctionsApp/clientes', [
            'segurados' => $segurados,
            'total' => $total,
            'totalAtivos' => $totalAtivos,
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

    public function exportar(ExportacaoSeguradosService $exportacaoService)
    {   
        return $exportacaoService->exportarSeguradosCsv();
    }
}
