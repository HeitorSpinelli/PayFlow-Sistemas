<?php

use Illuminate\Support\Facades\Route;
use Laravel\Fortify\Features;
use App\Http\Controllers\SeguradoController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\ApolicesController;
use App\Http\Controllers\SeguradoraController;
use App\Http\Controllers\pagamentoController;

// Rota Inicial
Route::inertia('/', 'welcome', [
    'canRegister' => Features::enabled(Features::registration()),
])->name('home');

// Rotas Protegidas por Autenticação
Route::middleware(['auth', 'verified'])->group(function () {

    // Dashboard
    Route::get('/dashboard', fn () => inertia('dashboard'))->name('dashboard');

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
    Route::get('/cobrancas', fn () => inertia('FunctionsApp/cobrancas'))->name('cobrancas');
    Route::get('/agenda', fn () => inertia('FunctionsApp/agenda'))->name('agenda');
    Route::get('/importar', fn () => inertia('FunctionsApp/importar'))->name('importar');
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

    Route::get('/notificacoes', function () {
        return inertia('FunctionsApp/notificacoes');
    })->name('notificacoes');

    Route::get('/administracao/usuarios', [UserController::class, 'index'])->name('users');
});

require __DIR__ . '/settings.php';