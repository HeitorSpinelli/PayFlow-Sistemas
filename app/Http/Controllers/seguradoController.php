<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreSeguradoRequest;
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
        $segurados = Segurado::all();
        
        return inertia('FunctionsApp/clientes', [
            'segurados' => $segurados,
        ]);
    }
}