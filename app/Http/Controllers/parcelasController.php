<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class parcelasController extends Controller
{
    //Controlador para gerenciar as parcelas de cada contrato de seguro, incluindo o número da parcela, valor, data de vencimento, status de pagamento, etc.
    public function store(Request $request)
    {
        //validação dos dados recebidos do formulário
        $validatedData = $request->validate([
            'apolice_id' => 'required|exists:apolices,id',
            'numero_parcela' => 'required|integer',
            'valor_parcela' => 'required|numeric',
            'data_vencimento' => 'required|date',
            'status_pagamento' => 'required|string',
        ]);

        //criação de uma nova parcela com os dados validados
        $parcela = new \App\Models\parcelas();
        $parcela->apolice_id = $validatedData['apolice_id'];
        $parcela->numero_parcela = $validatedData['numero_parcela'];
        $parcela->valor_parcela = $validatedData['valor_parcela'];
        $parcela->data_vencimento = $validatedData['data_vencimento'];
        $parcela->status_pagamento = $validatedData['status_pagamento'];
        $parcela->save();

        //retornar uma resposta de sucesso ou redirecionar para outra página
        return response()->json(['message' => 'Parcela cadastrada com sucesso!'], 201);
    }
}
