<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreNotificacaoRequest;
use App\Services\Notificacao\NotificacaoService;
use Illuminate\Http\Request;

class NotificacoesController extends Controller
{

    protected NotificacaoService $notificacoes;

    public function __construct(NotificacaoService $notificacoes)
    {
        $this->notificacoes = $notificacoes;
    }

    public function store(StoreNotificacaoRequest $request)
    {
        try {
            $this->notificacoes->criarEEnviar($request->validated());
            return redirect()->back()->with('success', 'notificação enviado com sucesso');
        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'Erro ao enviar notificação: ' . $e->getMessage());
        }
    }
}
