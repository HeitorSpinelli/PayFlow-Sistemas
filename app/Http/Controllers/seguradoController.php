<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreSeguradoRequest;
use App\Models\Segurado;
use Illuminate\Http\Request;

class SeguradoController extends Controller
{
    
    public function store(StoreSeguradoRequest $request)
    {     
        $data = $request->validated();
    }

    public function retorna()
    {
        $segurados = Segurado::all();
        
        return inertia('FunctionsApp/clientes', [
            'segurados' => $segurados,
        ]);
    }
}