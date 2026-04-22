<?php

use Illuminate\Support\Facades\Route;
use Laravel\Fortify\Features;

Route::inertia('/', 'welcome', [
    'canRegister' => Features::enabled(Features::registration()),
])->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::inertia('dashboard', 'dashboard')->name('dashboard');
});

Route::middleware(['auth', 'verified'])->group(function () {

    Route::inertia('/clientes', 'FunctionsApp/clientes')->name('clientes');
    Route::inertia('/apolices', 'FunctionsApp/apolices')->name('apolices');
    Route::inertia('/cobrancas', 'FunctionsApp/cobrancas')->name('cobrancas');
    Route::inertia('/pagamentos', 'FunctionsApp/pagamentos')->name('pagamentos');
    Route::inertia('/agenda', 'FunctionsApp/agenda')->name('agenda');
    Route::inertia('/importar', 'FunctionsApp/importar')->name('importar');
    Route::inertia('/notificacoes', 'FunctionsApp/notificacoes')->name('notificacoes');
    Route::inertia('/configuracoes', 'FunctionsApp/configuracoes')->name('configuracoes');

});

require __DIR__.'/settings.php';
