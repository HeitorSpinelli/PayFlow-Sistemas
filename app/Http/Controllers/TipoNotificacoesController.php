<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\TipoNotificacao;

class TipoNotificacoesController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $tipos_notificacao = TipoNotificacao::all();

        return $tipos_notificacao;
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        //Validação dos dados
        $request->validate([
            'nome_notificacao' => 'required|string|max:50'
        ]);

        try {
            TipoNotificacao::create([
                'nome_notificacao' => $request->nome_notificacao
            ]);
            return redirect()->back()->with('success', 'Tipo criado com sucesso!');
        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'Erro ao criar tipo: ' . $e->getMessage());
        }
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        try {
            $tipo = TipoNotificacao::findOrFail($id);

            if ($request->has('nome_notificacao')) {
                $request->validate([
                    'nome_notificacao' => 'required|string|max:50'
                ]);
                $tipo->update([
                    'nome_notificacao' => $request->nome_notificacao
                ]);
                return redirect()->back()->with('success', 'Nome Alterado');
            } else {
                $request->validate([
                    'ativo' => 'required|boolean'
                ]);
                $tipo->update([
                    'ativo' => $request->ativo
                ]);
                return redirect()->back()->with('success', 'Status Alterado');
            }
        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'Erro ao alterar: ' . $e->getMessage());
        }
    }
}
