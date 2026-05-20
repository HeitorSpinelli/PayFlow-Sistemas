<?php

use Illuminate\Support\Facades\Route;
use Laravel\Fortify\Features;
use App\Http\Controllers\SeguradoController;
use App\Http\Controllers\ApolicesController;
use App\Models\Client;

Route::inertia('/', 'welcome', [
    'canRegister' => Features::enabled(Features::registration()),
])->name('home');

Route::middleware(['auth', 'verified'])->group(function () {

    Route::get('/dashboard', function () {
        return inertia('dashboard');
    })->name('dashboard');

    //Rota para consulta no banco dos segurados cadastrados no sistema
    Route::get('/clientes', [SeguradoController::class, 'retorna'])->name('clientes');

    //Rota para salvar clientes via post chamando a classe SeguradoController e a função store
    Route::post('/clientes', [SeguradoController::class, 'store']);

    Route::get('/apolices', [ApolicesController::class, 'buscar'])->name('apolices');

    //Rota para salvar apolices via post, chamando a classe ApolicesController e a função store
    Route::post('/apolices', [ApolicesController::class, 'store']);

    Route::get('/cobrancas', function () {
        return inertia('FunctionsApp/cobrancas');
    })->name('cobrancas');

    Route::get('/pagamentos', function () {
        return inertia('FunctionsApp/pagamentos');
    })->name('pagamentos');

    Route::get('/agenda', function () {
        return inertia('FunctionsApp/agenda');
    })->name('agenda');

    Route::get('/importar', function () {
        return inertia('FunctionsApp/importar');
    })->name('importar');

    Route::get('/notificacoes', function () {
        return inertia('FunctionsApp/notificacoes');
    })->name('notificacoes');

    Route::get('/configuracoes', function () {
        return inertia('FunctionsApp/configuracoes');
    })->name('configuracoes');

});

require __DIR__.'/settings.php';