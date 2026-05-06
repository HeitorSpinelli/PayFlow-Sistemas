<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class seguradorasController extends Controller
{
    //Controlador para gerenciar as seguradoras parceiras, como Porto Seguro, Bradesco Seguros, SulAmérica, etc.
    public function storeSeguradora(Request $request)
    {
        //validação dos dados recebidos do formulário
        $validatedData = $request->validate([
            'nome_fantasia' => 'required|string',
            'razao_social' => 'required|string',
            'cnpj' => 'required|string|unique:seguradoras,cnpj',
            'contato_nome' => 'required|string',
            'email_suporte' => 'required|email',
        ]);

        //criação de uma nova seguradora com os dados validados
        $seguradora = new \App\Models\seguradora();
        $seguradora->nome_fantasia = $validatedData['nome_fantasia'];
        $seguradora->razao_social = $validatedData['razao_social'];
        $seguradora->cnpj = $validatedData['cnpj'];
        $seguradora->contato_nome = $validatedData['contato_nome'];
        $seguradora->email_suporte = $validatedData['email_suporte'];
        $seguradora->save();

        //retornar uma resposta de sucesso ou redirecionar para outra página
        return response()->json(['message' => 'Seguradora cadastrada com sucesso!'], 201);
    }
}
