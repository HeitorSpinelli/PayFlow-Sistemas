<?php

namespace App\Http\Controllers;

use App\Services\Apolice\ApoliceService;
use App\Services\Cliente\SeguradoService;
use App\Services\Notificacao\NotificacaoService;

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

    public function index()
    {
        $totalClientes = $this->seguradoService->count();
        $apolicesAtivas = $this->apoliceService->contarAtivas();
        $clientesDevedores = $this->apoliceService->contarClientesDevedores();
        $receitaDoMes = $this->apoliceService->receitaDoMes();
        $vencimentosProximos = $this->apoliceService->vencimentosProximos();
        $notificacoesRecentes = $this->notificacaoService->recentes();

        // Dados para os gráficos do dashboard
        $receitaMensal = $this->apoliceService->receitaUltimosMeses();
        $clientesAtivosMensal = $this->seguradoService->clientesAtivosUltimosMeses();
        $distribuicaoPorRamo = $this->apoliceService->distribuicaoPorRamo();

        return inertia('dashboard', [
            'totalClientes' => $totalClientes,
            'apolicesAtivas' => $apolicesAtivas,
            'clientesDevedores' => $clientesDevedores,
            'receitaDoMes' => $receitaDoMes,
            'vencimentosProximos' => $vencimentosProximos,
            'notificacoesRecentes' => $notificacoesRecentes,
            'receitaMensal' => $receitaMensal,
            'clientesAtivosMensal' => $clientesAtivosMensal,
            'distribuicaoPorRamo' => $distribuicaoPorRamo,
        ]);
    }
}
