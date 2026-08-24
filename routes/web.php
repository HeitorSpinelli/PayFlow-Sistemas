<?php

use Illuminate\Support\Facades\Route;
use Laravel\Fortify\Features;
use App\Http\Controllers\SeguradoController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\NotificacoesController;
use App\Http\Controllers\ApolicesController;
use App\Models\TipoNotificacao;
use App\Http\Controllers\TipoNotificacoesController;
use App\Http\Controllers\SeguradoraController;
use App\Http\Controllers\pagamentoController;
use App\Models\Segurado;
use App\Http\Controllers\ImportacaoController;
use Illuminate\Support\Facades\Mail;

// Rota Inicial
Route::inertia('/', 'welcome', [
    'canRegister' => Features::enabled(Features::registration()),
])->name('home');

// Rotas Protegidas por Autenticação
Route::middleware(['auth', 'verified'])->group(function () {

    // Dashboard
    Route::get('/dashboard', fn() => inertia('dashboard'))->name('dashboard');

    // Módulo: Clientes (Segurados)
    Route::prefix('clientes')->group(function () {
        Route::get('/', [SeguradoController::class, 'show'])->name('clientes');
        Route::post('/', [SeguradoController::class, 'store']);
        Route::put('/{id}', [SeguradoController::class, 'update'])->name('clientes.update');
        Route::delete('/{id}', [SeguradoController::class, 'destroy'])->name('clientes.destroy');
        Route::get('/exportar', [SeguradoController::class, 'exportar']);
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
        Route::put('/{id}', [pagamentoController::class, 'update'])->name('pagamentos.update');
        Route::delete('/{id}', [pagamentoController::class, 'destroy'])->name('pagamentos.destroy');
    });

    // Páginas Estáticas / Inertia Gerais
    Route::get('/cobrancas', fn() => inertia('FunctionsApp/cobrancas'))->name('cobrancas');
    Route::get('/agenda', fn() => inertia('FunctionsApp/agenda'))->name('agenda');
    Route::get('/importar', fn() => inertia('FunctionsApp/importar', [
        'importResumo' => session('importResumo'),
    ]))->name('importar');

    // Módulo: Importação de planilha
    Route::post('/importar-dados', [ImportacaoController::class, 'store'])->name('importar-dados.store');
});

// Rotas Exclusivas para Administradores
Route::middleware(['auth', 'can:is-admin'])->group(function () {

    // Módulo: Seguradoras
    Route::prefix('seguradoras')->group(function () {
        Route::get('/', [SeguradoraController::class, 'index'])->name('seguradoras');
        Route::post('/', [SeguradoraController::class, 'store']);
        Route::put('/{id}', [SeguradoraController::class, 'update'])->name('seguradoras.update');
        Route::delete('/{id}', [SeguradoraController::class, 'destroy'])->name('seguradoras.destroy');
    });

    Route::post('/seguradoras', [SeguradoraController::class, 'store']);
    Route::delete('/clientes/{id}', [SeguradoController::class, 'destroy'])->name('clientes.destroy');
    Route::put('/clientes/{id}', [SeguradoController::class, 'update'])->name('clientes.update');

    Route::prefix('/notificacoes')->group(function () {
        Route::get('/', function () {
            return inertia('FunctionsApp/notificacoes', [
                'tipos' => TipoNotificacao::all(),
                'segurados' => Segurado::all(),
                'notificacoes' => \App\Models\notificacoes::with(['tipoNotificacao', 'segurado'])->paginate(10)
            ]);
        })->name('notificacoes');
        Route::post('/', [NotificacoesController::class, 'store']);
        Route::get('/filtrar', [NotificacoesController::class, 'filtrar']);
    });

    Route::prefix('/tipo_notificacoes')->group(function () {
        Route::get('/', [TipoNotificacoesController::class, 'index']);
        Route::post('/', [TipoNotificacoesController::class, 'store']);
        Route::patch('/{id}', [TipoNotificacoesController::class, 'update']);
    });

    Route::get('/administracao/usuarios', [UserController::class, 'index'])->name('users');
});

require __DIR__ . '/settings.php';
