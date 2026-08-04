<?php

use Illuminate\Support\Facades\Route;
use Laravel\Fortify\Features;
use App\Http\Controllers\SeguradoController;
use App\Http\Controllers\ApolicesController;
use App\Http\Controllers\SeguradoraController;
use App\Http\Controllers\pagamentoController;

Route::inertia('/', 'welcome', [
    'canRegister' => Features::enabled(Features::registration()),
])->name('home');

Route::middleware(['auth', 'verified'])->group(function () {

    Route::get('/dashboard', function () {
        return inertia('dashboard');
    })->name('dashboard');

    //Rota para consulta no banco dos segurados cadastrados no sistema
    Route::get('/clientes', [SeguradoController::class, 'show'])->name('clientes');

    //Rota para salvar clientes via post chamando a classe SeguradoController e a função store
    Route::post('/clientes', [SeguradoController::class, 'store']);
    Route::delete('/clientes/{id}', [SeguradoController::class, 'destroy'])->name('clientes.destroy');
    Route::put('/clientes/{id}', [SeguradoController::class, 'update'])->name('clientes.update');

    // Rota para exportar os dados
    Route::get('/segurados/exportar', [SeguradoController::class, 'exportar']);

    //Rota para exibir a página de apolices, chamando a classe ApolicesController e a função index
    Route::get('/apolices', [ApolicesController::class, 'index'])->name('apolices');

    Route::delete('/apolices/{id}', [ApolicesController::class, 'destroy'])->name('apolices.destroy');
    Route::put('/apolices/{id}', [ApolicesController::class, 'update'])->name('apolices.update');

    //Rotas Patch são usadas para atualizar parcialmente um recurso existente, nesse caso a rota é usada para alterar o ramo de uma apólice específica, chamando a 
    //função atualizarRamo da classe ApolicesController
    Route::patch('/apolices/{id}/alterar-ramo', [ApolicesController::class, 'atualizarRamo']);

    //Rota para salvar apolices via post, chamando a classe ApolicesController e a função store
    Route::post('/apolices', [ApolicesController::class, 'store']);

    Route::get('/cobrancas', function () {
        return inertia('FunctionsApp/cobrancas');
    })->name('cobrancas');

    //Rota para exibir a página de pagamentos, chamando a classe pagamentoController e a função show
    Route::get('/pagamentos', [pagamentoController::class, 'show'])->name('pagamentos');
    Route::post('/pagamentos', [pagamentoController::class, 'store']);
    Route::delete('/pagamentos/{id}', [pagamentoController::class, 'destroy'])->name('pagamentos.destroy');
    Route::put('/pagamentos/{id}', [pagamentoController::class, 'update'])->name('pagamentos.update');

    Route::get('/agenda', function () {
        return inertia('FunctionsApp/agenda');
    })->name('agenda');

    Route::get('/importar', function () {
        return inertia('FunctionsApp/importar');
    })->name('importar');
});

//Rotas de funções exclusivas para admins, utilizadno middlware para verificar se é admin pelo appserviceprovider
Route::middleware('auth', 'can:is-admin')->group(function () {
    Route::get('/seguradoras', function () {
        return inertia('FunctionsApp/seguradoras');
    })->name('seguradoras');

    Route::post('/seguradoras', [SeguradoraController::class, 'store']);

    Route::get('/notificacoes', function () {
        return inertia('FunctionsApp/notificacoes');
    })->name('notificacoes');

    Route::get('/administracao', function () {
        return inertia('FunctionsApp/administracao');
    })->name('administracao');
});

require __DIR__ . '/settings.php';
