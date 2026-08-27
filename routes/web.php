<?php

use Illuminate\Support\Facades\Route;
use Laravel\Fortify\Features;
use App\Models\Segurado;
use App\Models\TipoNotificacao;
use App\Models\Automacao;
use App\Http\Controllers\ApolicesController;
use App\Http\Controllers\AutomacoesController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\ImportacaoController;
use App\Http\Controllers\NotificacoesController;
use App\Http\Controllers\pagamentoController;
use App\Http\Controllers\SeguradoraController;
use App\Http\Controllers\SeguradoController;
use App\Http\Controllers\TipoNotificacoesController;
use App\Http\Controllers\UserController;

/* ------------------------------------------------------------------ */
/* Rota Inicial                                                        */
/* ------------------------------------------------------------------ */

Route::inertia('/', 'welcome', [
    'canRegister' => Features::enabled(Features::registration()),
])->name('home');

/* ------------------------------------------------------------------ */
/* Rotas Protegidas por Autenticação                                   */
/* ------------------------------------------------------------------ */

Route::middleware(['auth', 'verified'])->group(function () {

    // Dashboard
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

    // Módulo: Clientes (Segurados)
    Route::prefix('clientes')->group(function () {
        Route::get('/', [SeguradoController::class, 'show'])->name('clientes');
        Route::post('/', [SeguradoController::class, 'store']);
        Route::put('/{id}', [SeguradoController::class, 'update'])->name('clientes.update');
        Route::delete('/{id}', [SeguradoController::class, 'destroy'])->name('clientes.destroy');
        Route::get('/exportar', [SeguradoController::class, 'exportar']);
        Route::get('/inativos', [SeguradoController::class, 'inativos'])->name('segurados.inativos');
        Route::patch('/restaurar/{id}', [SeguradoController::class, 'restaurar'])->name('segurados.restore');
    });

    // Módulo: Apólices
    Route::prefix('apolices')->group(function () {
        Route::get('/', [ApolicesController::class, 'index'])->name('apolices');
        Route::post('/', [ApolicesController::class, 'store']);
        Route::put('/{id}', [ApolicesController::class, 'update'])->name('apolices.update');
        Route::delete('/{id}', [ApolicesController::class, 'destroy'])->name('apolices.destroy');
        Route::patch('/{id}/alterar-ramo', [ApolicesController::class, 'atualizarRamo']);
        Route::get('/exportar', [ApolicesController::class, 'exportar']);
    });

    // Módulo: Pagamentos
    Route::prefix('pagamentos')->group(function () {
        Route::get('/', [pagamentoController::class, 'show'])->name('pagamentos');
        Route::post('/', [pagamentoController::class, 'store']);
        Route::delete('/{id}', [pagamentoController::class, 'destroy'])->name('pagamentos.destroy');
        Route::get('/exportar', [pagamentoController::class, 'exportar']);
    });

    // Páginas Estáticas
    Route::get('/agenda', fn() => inertia('FunctionsApp/agenda'))->name('agenda');
    Route::get('/importar', fn() => inertia('FunctionsApp/importar', [
        'importResumo' => session('importResumo'),
    ]))->name('importar');

    // Módulo: Importação
    Route::post('/importar-dados', [ImportacaoController::class, 'store'])->name('importar-dados.store');
});

/* ------------------------------------------------------------------ */
/* Rotas Exclusivas para Administradores                               */
/* ------------------------------------------------------------------ */

Route::middleware(['auth', 'can:is-admin'])->group(function () {

    // Módulo: Seguradoras
    Route::prefix('seguradoras')->group(function () {
        Route::get('/', [SeguradoraController::class, 'index'])->name('seguradoras');
        Route::post('/', [SeguradoraController::class, 'store']);
        Route::put('/{id}', [SeguradoraController::class, 'update'])->name('seguradoras.update');
        Route::delete('/{id}', [SeguradoraController::class, 'destroy'])->name('seguradoras.destroy');
    });

    // Módulo: Notificações
    Route::prefix('/notificacoes')->group(function () {
        Route::get('/', function () {
            return inertia('FunctionsApp/notificacoes', [
                'totalHoje'     => \App\Models\Notificacoes::whereDate('created_at', today())->count(),
                'totalEnviados' => \App\Models\Notificacoes::where('status', 'Enviado')->count(),
                'totalPendentes' => \App\Models\Notificacoes::where('status', 'Pendente')->count(),
                'totalFalhas'   => \App\Models\Notificacoes::where('status', 'Falha')->count(),
                'tipos'        => TipoNotificacao::all(),
                'segurados'    => Segurado::all(),
                'notificacoes' => \App\Models\Notificacoes::with(['tipoNotificacao', 'segurado'])->paginate(10),
                'automacoes' => \App\Models\Automacao::with('notificacoes')->get(),
            ]);
        })->name('notificacoes');
        Route::post('/', [NotificacoesController::class, 'store']);
        Route::get('/filtrar', [NotificacoesController::class, 'filtrar']);
    });

    // Módulo: Tipos de Notificação
    Route::prefix('/tipo_notificacoes')->group(function () {
        Route::get('/', [TipoNotificacoesController::class, 'index']);
        Route::post('/', [TipoNotificacoesController::class, 'store']);
        Route::patch('/{id}', [TipoNotificacoesController::class, 'update']);
    });

    // Módulo: Automações
    Route::prefix('/automacoes')->group(function () {
        Route::get('/', [AutomacoesController::class, 'index']);
        Route::post('/', [AutomacoesController::class, 'store']);
        Route::put('/{id}', [AutomacoesController::class, 'update']);
        Route::patch('/{id}/toggle', [AutomacoesController::class, 'toggle']);
        Route::delete('/{id}', [AutomacoesController::class, 'destroy']);
    });

    // Administração
    Route::get('/administracao/usuarios', [UserController::class, 'index'])->name('users');
});

require __DIR__ . '/settings.php';
