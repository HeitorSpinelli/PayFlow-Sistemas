<?php

namespace App\Http\Controllers;

use App\Services\Apolice\ApoliceService;
use App\Services\Cliente\SeguradoService;
use App\Services\Notificacao\NotificacaoService;

/**
 * Controller da tela inicial após o login: Dashboard (/dashboard, dashboard.tsx).
 */
class DashboardController extends Controller
{
    protected SeguradoService $seguradoService;

    protected ApoliceService $apoliceService;

    protected NotificacaoService $notificacaoService;

    public function __construct(ApoliceService $apoliceService, SeguradoService $seguradoService, NotificacaoService $notificacaoService)
    {
        $this->apoliceService = $apoliceService;
        $this->seguradoService = $seguradoService;
        $this->notificacaoService = $notificacaoService;
    }

    /**
     * Alimenta o Dashboard: card de clientes devedores, lista "Vencimentos
     * próximos", card "Notificações" (últimas enviadas), gráfico de receita
     * mensal, gráfico de clientes ativos por mês e o gráfico de pizza
     * "Tipos de seguro" (distribuição por ramo).
     */
    public function index()
    {
        $clientesDevedores = $this->apoliceService->contarClientesDevedores();
        $vencimentosProximos = $this->apoliceService->vencimentosProximos();
        $notificacoesRecentes = $this->notificacaoService->recentes();

        // Dados para os gráficos do dashboard
        $receitaMensal = $this->apoliceService->receitaUltimosMeses();
        $clientesAtivosMensal = $this->seguradoService->clientesAtivosUltimosMeses();
        $distribuicaoPorRamo = $this->apoliceService->distribuicaoPorRamo();

        return inertia('dashboard', [
            'clientesDevedores' => $clientesDevedores,
            'vencimentosProximos' => $vencimentosProximos,
            'notificacoesRecentes' => $notificacoesRecentes,
            'receitaMensal' => $receitaMensal,
            'clientesAtivosMensal' => $clientesAtivosMensal,
            'distribuicaoPorRamo' => $distribuicaoPorRamo,
        ]);
    }
}
