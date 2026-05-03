<?php

namespace App\Http\Controllers;

use App\Models\Client;
use Illuminate\Http\Request;

class ClientController extends Controller
{
    public function store(Request $request)
    {
        $data = $request->validate([
            'tipo_cliente' => 'required|in:pf,pj',
            'nome' => 'required|string|max:255',
            'email' => 'nullable|email|max:255',
            'telefone' => 'nullable|string|max:20',

            // PF
            'cpf' => 'nullable|string|max:20',
            'data_nascimento' => 'nullable|date',

            // PJ
            'cnpj' => 'nullable|string|max:20',
            'data_fundacao' => 'nullable|date',
        ]);

        Client::create($data);

        return redirect()->back()->with('success', 'Cliente criado com sucesso!');
    }
}