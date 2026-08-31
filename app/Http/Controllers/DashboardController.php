<?php

namespace App\Http\Controllers;

use App\Services\Apolice\ApoliceService;
use App\Services\Cliente\SeguradoService;

class DashboardController extends Controller
{
    protected SeguradoService $seguradoService;

    protected ApoliceService $apoliceService;

    public function __construct(ApoliceService $apoliceService, SeguradoService $seguradoService)
    {
        $this->apoliceService = $apoliceService;
        $this->seguradoService = $seguradoService;
    }

    public function index()
    {
        $totalClientes = $this->seguradoService->count();
        $apolicesAtivas = $this->apoliceService->contarAtivas();
        $clientesDevedores = $this->apoliceService->contarClientesDevedores();
        $receitaDoMes = $this->apoliceService->receitaDoMes();
        $vencimentosProximos = $this->apoliceService->vencimentosProximos();

        return inertia('dashboard', [
            'totalClientes' => $totalClientes,
            'apolicesAtivas' => $apolicesAtivas,
            'clientesDevedores' => $clientesDevedores,
            'receitaDoMes' => $receitaDoMes,
            'vencimentosProximos' => $vencimentosProximos,
        ]);
    }
}
