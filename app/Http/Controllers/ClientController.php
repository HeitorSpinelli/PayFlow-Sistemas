<?php

namespace App\Http\Controllers;

use App\Models\Segurado;
use Illuminate\Http\Request;

class ClientController extends Controller
{
    public function createSegurado(Request $request)
    {
        $data = $request->validate([
            'nome_completo'            => 'required|string|max:255',
            'tipo_pessoa'              => 'required|in:pf,pj',
            'cpf_cnpj'                 => 'required|string|max:20|unique:segurados,cpf_cnpj',
            'data_nascimento_fundacao' => 'nullable|date',
            'email'                    => 'nullable|email|max:255',
            'telefone_fixo'            => 'nullable|string|max:20',
            'celular_whatsapp'         => 'nullable|string|max:20',
            'endereco'                 => 'nullable|string',
            'cidade'                   => 'nullable|string|max:100',
            'estado'                   => 'nullable|string|size:2',
            'cep'                      => 'nullable|string|max:15',
            'status'                   => 'nullable|string|in:Ativo,Inativo,Pendente',
            'observacoes'              => 'nullable|string',
        ]);

        segurado::create($data);

        return redirect()->back()->with('success', 'Cliente cadastrado com sucesso!');
    }
}