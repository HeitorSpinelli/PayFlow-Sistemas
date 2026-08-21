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

        try{
            return TipoNotificacao::crete([
                'nome_notificacao' => $request,
            ]);
        }catch
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        //
    }

}
