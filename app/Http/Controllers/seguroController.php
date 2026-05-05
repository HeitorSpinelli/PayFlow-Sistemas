<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class seguradoraController extends Controller
{
    //função para cadastrar um novo contrato de seguro, recebendo os dados do formulário e salvando no banco de dados

    public function storeSeguro(Request $request)
    {
        //validação dos dados recebidos do formulário
        $validatedData = $request->validate([
            'numero_apolice' => 'required|unique:apolices',
            'cliente_id' => 'required|exists:clients,id',
            'seguradora_id' => 'required|exists:seguradoras,id',
            'ramo_id' => 'required|exists:ramos,id',
            'valor_premio_total' => 'required|numeric',
            'valor_cobertura' => 'required|numeric',
            'quantidade_parcelas' => 'required|integer',
            'forma_pagamento' => 'required|string',
            'inicio_vigencia' => 'required|date',
            'fim_vigencia' => 'required|date|after:inicio_vigencia',
        ]);
    }
}
