<?php

namespace App\Http\Controllers;

use App\Models\Client;
use Illuminate\Http\Request;

class ClientController extends Controller
{
    public function store(Request $request)
    {
        $data = $request->validate([
            'tipo_pessoa'              => 'required|in:pf,pj',       
            'nome_completo'            => 'required|string|max:255',  
            'email'                    => 'nullable|email|max:255',
            'telefone'                 => 'nullable|string|max:20',
            'cpf_cnpj'                 => 'nullable|string|max:20', 
            'data_nascimento_fundacao' => 'nullable|date',            
            'endereco'                 => 'nullable|string|max:255',
            'cidade'                   => 'nullable|string|max:255',
            'estado'                   => 'nullable|string|max:2',
            'cep'                      => 'nullable|string|max:10',
            'status'                   => 'nullable|string|in:ativo,inativo',
        ]);

        Client::create($data);

        return redirect()->back()->with('success', 'Cliente criado com sucesso!');
    }
}