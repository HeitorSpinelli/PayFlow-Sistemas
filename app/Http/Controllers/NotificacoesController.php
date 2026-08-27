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

    public function filtrar(Request $request)
    {
        $query = \App\Models\Notificacoes::with(['tipoNotificacao', 'segurado']);
        $query->when($request->has('canal'), function ($q) use ($request) {
            $q->where('canal', $request->canal);
        });
        $query->when($request->has('status'), function ($q) use ($request) {
            $q->where('status', $request->status);
        });

        $query->when($request->has('busca'), function ($q) use ($request) {
            $q->where(function ($q2) use ($request) {
                $q2->where('mensagem', 'ilike', '%' . $request->busca . '%')
                    ->orWhere('canal', 'ilike', '%' . $request->busca . '%');
            });
        });

        return inertia('FunctionsApp/notificacoes', [
            'notificacoes' => $query->paginate(10)
        ]);
    }
}
