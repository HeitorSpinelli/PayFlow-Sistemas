<?php

use App\Http\Controllers\AgendaController;
use App\Http\Controllers\ApolicesController;
use App\Http\Controllers\AutomacoesController;
use App\Http\Controllers\ConfiguracaoInicialController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\ImportacaoController;
use App\Http\Controllers\NotificacoesController;
use App\Http\Controllers\pagamentoController;
use App\Http\Controllers\RamosController;
use App\Http\Controllers\SeguradoController;
use App\Http\Controllers\SeguradoraController;
use App\Http\Controllers\TipoNotificacoesController;
use App\Http\Controllers\UserController;
use App\Models\Automacao;
use App\Models\Notificacoes;
use App\Models\Segurado;
use App\Models\TipoNotificacao;
use App\Models\User;
use Illuminate\Support\Facades\Route;

/* ------------------------------------------------------------------ */
/* Rota Inicial */
/* ------------------------------------------------------------------ */

// Sem usuário nenhum no banco, manda direto pra Configuração Inicial em vez
// da página de boas-vindas — quem acabou de instalar o sistema não tem
// motivo pra ver um botão "Entrar no Sistema" que não leva a lugar nenhum.
Route::get('/', function () {
    if (! User::query()->exists()) {
        return redirect()->route('configuracao-inicial');
    }

    return inertia('welcome');
})->name('home');

/* ------------------------------------------------------------------ */
/* Configuração Inicial (bootstrap do primeiro admin) */
/* ------------------------------------------------------------------ */

// Só acessível enquanto não existir nenhum usuário no banco — mesmo
// comportamento que /register tinha antes de ser desativado: sem usuário
// nenhum, dá 404 de verdade (ConfiguracaoInicialController garante isso),
// não é uma tela "escondida" sem link visível.
Route::get('/configuracao-inicial', [ConfiguracaoInicialController::class, 'create'])->name('configuracao-inicial');
Route::post('/configuracao-inicial', [ConfiguracaoInicialController::class, 'store']);

/* ------------------------------------------------------------------ */
/* Rotas Protegidas por Autenticação */
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
        Route::patch('/restaurar/{id}', [SeguradoController::class, 'restaurar'])->name('segurados.restore');
    });

    // Módulo: Apólices
    Route::prefix('apolices')->group(function () {
        Route::get('/', [ApolicesController::class, 'index'])->name('apolices');
        Route::post('/', [ApolicesController::class, 'store']);
        Route::put('/{id}', [ApolicesController::class, 'update'])->name('apolices.update');
        // Cancelar (destroy), reativar uma suspensão, renovar e restaurar uma
        // apólice cancelada são ações com peso legal/financeiro (Lei
        // 15.040/2024, art. 21; renovar gera uma apólice nova; restaurar
        // desfaz um cancelamento) — exigem admin, diferente do resto do
        // módulo de apólices, que qualquer atendente autenticado usa.
        Route::delete('/{id}', [ApolicesController::class, 'destroy'])->middleware('can:is-admin')->name('apolices.destroy');
        Route::patch('/{id}/alterar-ramo', [ApolicesController::class, 'updateRamo']);
        Route::patch('/ativar/{id}', [ApolicesController::class, 'ativar'])->middleware('can:is-admin')->name('apolices.ativar');
        Route::patch('/renovar/{id}', [ApolicesController::class, 'renovar'])->middleware('can:is-admin')->name('apolices.renovar');
        Route::patch('/restaurar/{id}', [ApolicesController::class, 'restaurar'])->middleware('can:is-admin')->name('apolices.restore');
        Route::get('/exportar', [ApolicesController::class, 'exportar']);
    });

    // Módulo: Pagamentos
    Route::prefix('pagamentos')->group(function () {
        Route::get('/', [pagamentoController::class, 'show'])->name('pagamentos');
        Route::post('/', [pagamentoController::class, 'store']);
        Route::delete('/{id}', [pagamentoController::class, 'destroy'])->name('pagamentos.destroy');
        Route::get('/exportar', [pagamentoController::class, 'exportar']);
        Route::get('/cliente/{clienteId}', [pagamentoController::class, 'porCliente']);
    });

    // Módulo: Agenda
    Route::get('/agenda', [AgendaController::class, 'index'])->name('agenda');

    // Páginas Estáticas
    Route::get('/importar', fn () => inertia('FunctionsApp/importar', [
        'importResumo' => session('importResumo'),
    ]))->name('importar');

    Route::get('/ajuda', fn () => inertia('FunctionsApp/ajuda'))->name('ajuda');

    // Módulo: Importação
    Route::post('/importar-dados', [ImportacaoController::class, 'store'])->name('importar-dados.store');
});

/* ------------------------------------------------------------------ */
/* Rotas Exclusivas para Administradores */
/* ------------------------------------------------------------------ */

Route::middleware(['auth', 'can:is-admin'])->group(function () {

    // Ajuda: Documentação do TCC (download restrito a administradores)
    Route::get('/ajuda/documentacao-tcc', function () {
        return response()->download(
            storage_path('app/private/documentacao-tcc.docx'),
            'Documentacao-TCC-PayFlow.docx'
        );
    })->name('ajuda.documentacao-tcc');

    // Módulo: Seguradoras
    Route::prefix('seguradoras')->group(function () {
        Route::get('/', [SeguradoraController::class, 'index'])->name('seguradoras');
        Route::post('/', [SeguradoraController::class, 'store']);
        Route::put('/{id}', [SeguradoraController::class, 'update'])->name('seguradoras.update');
        Route::delete('/{id}', [SeguradoraController::class, 'destroy'])->name('seguradoras.destroy');
    });

    // Módulo: Ramos (das seguradoras) — antes existiam controller e service,
    // mas nenhuma rota apontava pra eles: não tinha como editar ou adicionar
    // ramo numa seguradora já cadastrada pela tela.
    Route::prefix('ramos')->group(function () {
        Route::post('/', [RamosController::class, 'store'])->name('ramos.store');
        Route::put('/{id}', [RamosController::class, 'update'])->name('ramos.update');
        Route::delete('/{id}', [RamosController::class, 'destroy'])->name('ramos.destroy');
    });

    // Módulo: Notificações
    Route::prefix('/notificacoes')->group(function () {
        Route::get('/', function () {
            return inertia('FunctionsApp/notificacoes', [
                'totalHoje' => Notificacoes::whereDate('created_at', today())->count(),
                'totalEnviados' => Notificacoes::where('status', 'Enviado')->count(),
                'totalPendentes' => Notificacoes::where('status', 'Pendente')->count(),
                'totalFalhas' => Notificacoes::where('status', 'Falha')->count(),
                'tipos' => TipoNotificacao::all(),
                // with('apolices'): Segurado::getStatusAttribute() reaproveita essa
                // relação já carregada em vez de rodar uma query EXISTS por cliente.
                'segurados' => Segurado::with('apolices')->get(),
                'notificacoes' => Notificacoes::with(['tipoNotificacao', 'segurado'])->paginate(10),
                'automacoes' => Automacao::with('tipoNotificacao')->get(),
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
    Route::prefix('/administracao')->group(function () {
        Route::get('/usuarios', [UserController::class, 'index'])->name('users');
        Route::post('/usuarios', [UserController::class, 'store']);
        Route::put('/usuarios/{id}', [UserController::class, 'update']);
        Route::delete('/usuarios/{id}', [UserController::class, 'destroy']);
    });
});

require __DIR__.'/settings.php';
