<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class ramosController extends Controller
{
    //ramo de cada contrato de seguro, como automóvel, residencial, vida, saúde, etc.
    public function storeRamo(Request $request)
    {
        //validação dos dados recebidos do formulário
        $validatedData = $request->validate([
            'nome_ramo' => 'required|string|unique:ramos,nome_ramo',
        ]);

        //criação de um novo ramo com os dados validados
        $ramo = new \App\Models\ramos();
        $ramo->nome_ramo = $validatedData['nome_ramo'];
        $ramo->save();

        //retornar uma resposta de sucesso ou redirecionar para outra página
        return response()->json(['message' => 'Ramo cadastrado com sucesso!'], 201);
    }
}
