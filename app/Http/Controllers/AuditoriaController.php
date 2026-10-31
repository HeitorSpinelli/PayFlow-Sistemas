<?php

namespace App\Http\Controllers;

use App\Models\Auditoria;
use App\Models\User;
use Illuminate\Http\Request;

/**
 * Tela Auditoria (/auditoria, só admin), aberta pelo item "Auditoria" do menu
 * do usuário. Lista quem criou, editou, excluiu, estornou ou restaurou o quê,
 * e quando, com filtros por usuário, módulo, ação, período e texto.
 */
class AuditoriaController extends Controller
{
    /**
     * Filtros e a tabela paginada do log. Os filtros chegam
     * pela query string (mesmo padrão das telas Clientes e Pagamentos), então
     * um F5 ou link copiado mantém a mesma visão.
     */
    public function index(Request $request)
    {
        $registros = Auditoria::with('user:id,name')
            ->when($request->filled('usuario'), function ($q) use ($request) {
                // 'sistema' = ações sem usuário (jobs e comandos agendados).
                $request->usuario === 'sistema'
                    ? $q->whereNull('user_id')
                    : $q->where('user_id', $request->integer('usuario'));
            })
            ->when($request->filled('modulo'), fn ($q) => $q->where('modulo', $request->modulo))
            ->when($request->filled('acao'), fn ($q) => $q->where('acao', $request->acao))
            ->when($request->filled('de'), fn ($q) => $q->whereDate('created_at', '>=', $request->date('de')))
            ->when($request->filled('ate'), fn ($q) => $q->whereDate('created_at', '<=', $request->date('ate')))
            ->when($request->filled('busca'), fn ($q) => $q->where('descricao', 'ilike', '%'.$request->busca.'%'))
            ->orderByDesc('created_at')
            ->orderByDesc('id')
            ->paginate(20)
            ->withQueryString()
            ->through(fn (Auditoria $registro) => [
                'id' => $registro->id,
                'data' => $registro->created_at,
                // NULL = Sistema (job/comando) ou usuário já excluído
                // (nullOnDelete); a tela mostra os dois como "Sistema".
                'usuario' => $registro->user?->name,
                'acao' => $registro->acao,
                'modulo' => $registro->modulo,
                'descricao' => $registro->descricao,
                'alteracoes' => $registro->alteracoes,
                'ip' => $registro->ip,
            ]);

        return inertia('FunctionsApp/auditoria', [
            'registros' => $registros,
            'filtros' => $request->only(['usuario', 'modulo', 'acao', 'de', 'ate', 'busca']),
            'usuarios' => User::orderBy('name')->get(['id', 'name']),
            'modulos' => Auditoria::query()->distinct()->orderBy('modulo')->pluck('modulo'),
        ]);
    }
}
