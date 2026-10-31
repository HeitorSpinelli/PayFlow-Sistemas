<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreNotificacaoRequest;
use App\Models\Automacao;
use App\Models\Notificacoes;
use App\Models\TipoNotificacao;
use App\Services\Notificacao\NotificacaoService;
use Illuminate\Http\Request;

/**
 * Controller da tela Notificações (/notificacoes, só admin): monta a tela,
 * com os filtros do histórico, e faz o envio manual.
 */
class NotificacoesController extends Controller
{

    protected NotificacaoService $notificacoes;

    public function __construct(NotificacaoService $notificacoes)
    {
        $this->notificacoes = $notificacoes;
    }

    /**
     * Envio manual de notificação pelo modal de envio (create-notificacao-modal.tsx),
     * aberto pelos botões de canal (e-mail / WhatsApp) da tela Notificações. Cria
     * um registro por segurado selecionado e tenta enviar o e-mail; o resultado
     * (Enviado/Falha) aparece no "Histórico de Notificações".
     */
    public function store(StoreNotificacaoRequest $request)
    {
        try {
            $this->notificacoes->criarEEnviar($request->validated());
            return redirect()->back()->with('success', 'notificação enviado com sucesso');
        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'Erro ao enviar notificação: ' . $e->getMessage());
        }
    }

    /**
     * Tela Notificações (GET /notificacoes): cards (hoje, enviados, pendentes,
     * falhas), "Histórico de Notificações", aba Automações e os dados do modal
     * de envio.
     *
     * Os filtros do histórico (canal, status, busca, page) chegam pela query
     * string desta mesma URL. Antes ficavam em /notificacoes/filtrar, que só
     * devolvia o histórico: um F5 lá carregava a tela sem cards, tipos,
     * segurados e automações. As props são closures para que o reload parcial
     * do filtro (only: ['notificacoes']) não recalcule o resto.
     */
    public function index(Request $request)
    {
        return inertia('FunctionsApp/notificacoes', [
            'totalHoje' => fn () => Notificacoes::whereDate('created_at', today())->count(),
            'totalEnviados' => fn () => Notificacoes::where('status', 'Enviado')->count(),
            'totalPendentes' => fn () => Notificacoes::where('status', 'Pendente')->count(),
            'totalFalhas' => fn () => Notificacoes::where('status', 'Falha')->count(),
            'tipos' => fn () => TipoNotificacao::all(),
            // seguradosParaNotificar() (em vez de só with('apolices')->get()):
            // embute em cada segurado a parcela em aberto mais relevante, para
            // o modal de WhatsApp montar a mensagem com dados reais (valor,
            // vencimento, atraso) — ver NotificacaoService::resumoParcelaCobranca().
            'segurados' => fn () => $this->notificacoes->seguradosParaNotificar(),
            'notificacoes' => fn () => $this->historico($request),
            'automacoes' => fn () => Automacao::with('tipoNotificacao')->get(),
        ]);
    }

    /**
     * URL antiga do filtro: redireciona para /notificacoes com os mesmos
     * parâmetros, para links e abas já abertas continuarem funcionando.
     */
    public function filtrar(Request $request)
    {
        return redirect()->route('notificacoes', $request->query());
    }

    /**
     * "Histórico de Notificações" paginado com os filtros da query string.
     * filled() em vez de has(): ?busca= vazio não deve filtrar nada.
     */
    private function historico(Request $request)
    {
        return Notificacoes::with(['tipoNotificacao', 'segurado'])
            ->when($request->filled('canal'), fn ($q) => $q->where('canal', $request->canal))
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->status))
            ->when($request->filled('busca'), function ($q) use ($request) {
                $q->where(function ($q2) use ($request) {
                    $q2->where('mensagem', 'ilike', '%'.$request->busca.'%')
                        ->orWhere('canal', 'ilike', '%'.$request->busca.'%');
                });
            })
            ->paginate(10)
            ->withQueryString();
    }
}
