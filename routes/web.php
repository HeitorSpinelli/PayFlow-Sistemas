<?php

use App\Http\Controllers\AgendaController;
use App\Http\Controllers\ApolicesController;
use App\Http\Controllers\AuditoriaController;
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
use App\Http\Controllers\DininhoController;
use App\Models\User;
use Illuminate\Support\Facades\Route;

/* ------------------------------------------------------------------ */
/* Rota Inicial */
/* ------------------------------------------------------------------ */

// Tela: welcome.tsx (página pública de boas-vindas, botão "Entrar no Sistema").
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
// Tela: auth/configuracao-inicial.tsx (formulário do primeiro admin).
Route::get('/configuracao-inicial', [ConfiguracaoInicialController::class, 'create'])->name('configuracao-inicial');
Route::post('/configuracao-inicial', [ConfiguracaoInicialController::class, 'store']);

/* ------------------------------------------------------------------ */
/* Rotas Protegidas por Autenticação */
/* ------------------------------------------------------------------ */

Route::middleware(['auth', 'verified', 'throttle:web-actions'])->group(function () {

    // Chat do assistente Dininho (dininho-widget.tsx), presente em todas as telas logadas.
    Route::post('/dininho/perguntar', [DininhoController::class, 'pergunta'])
    ->middleware('throttle:4,1');
    
    // Dashboard
    // Tela: dashboard.tsx — primeira tela depois do login.
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

    // Módulo: Clientes (Segurados)
    // Tela Clientes (clientes.tsx): lista, modal "Novo Cliente", painel do
    // cliente (editar), lixeira, exportar CSV e ficha impressa. A rota restaurar
    // é usada na seção "Clientes Inativos (Lixeira)" da tela Administração.
    Route::prefix('clientes')->group(function () {
        Route::get('/', [SeguradoController::class, 'show'])->name('clientes');
        Route::post('/', [SeguradoController::class, 'store']);
        Route::put('/{id}', [SeguradoController::class, 'update'])->name('clientes.update');
        Route::delete('/{id}', [SeguradoController::class, 'destroy'])->name('clientes.destroy');
        Route::get('/exportar', [SeguradoController::class, 'exportar']);
        Route::get('/{id}/ficha', [SeguradoController::class, 'ficha'])->whereNumber('id')->name('clientes.ficha');
        Route::patch('/restaurar/{id}', [SeguradoController::class, 'restaurar'])->name('segurados.restore');
    });

    // Módulo: Apólices
    // Tela Apólices (apolices.tsx): lista, modal "Nova Apólice", modal de perfil
    // (editar/excluir) e exportar CSV. ativar/renovar/restaurar são botões das
    // seções de apólices da tela Administração. alterar-ramo não é chamada por
    // nenhuma tela hoje.
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
    // Tela Pagamentos (pagamentos.tsx): lista, modal "Registrar Pagamento",
    // estorno (lixeira), exportar CSV, exportar por apólice (painel do cliente) e
    // cupom impresso. /cliente/{id} não é chamada por nenhuma tela hoje.
    Route::prefix('pagamentos')->group(function () {
        Route::get('/', [pagamentoController::class, 'show'])->name('pagamentos');
        Route::post('/', [pagamentoController::class, 'store']);
        // Estornar um pagamento é reversão financeira: reabre a parcela e, se
        // ela já estiver vencida, suspende a apólice na hora — colocando-a na
        // trilha do cancelamento automático em 30 dias. É o mesmo peso das
        // ações de apólice que já exigem admin, então exige aqui também.
        Route::delete('/{id}', [pagamentoController::class, 'destroy'])->middleware('can:is-admin')->name('pagamentos.destroy');
        Route::get('/exportar', [pagamentoController::class, 'exportar']);
        // whereNumber: sem isso, /pagamentos/cliente/abc entrega a string ao
        // parâmetro tipado `int` do controller e estoura TypeError — que é
        // \Error, escapa de todos os catches e vira 500. Com a restrição, o
        // roteador simplesmente não casa a rota e devolve 404.
        // Também fecha /cliente/1.5, que era coagido para 1 e devolvia 200
        // com o histórico de OUTRO cliente.
        Route::get('/cliente/{clienteId}', [pagamentoController::class, 'porCliente'])->whereNumber('clienteId');
        Route::get('/apolice/{apoliceId}/exportar', [pagamentoController::class, 'exportarPorApolice'])->whereNumber('apoliceId');
        Route::get('/{id}/cupom', [pagamentoController::class, 'cupom'])->whereNumber('id')->name('pagamentos.cupom');
    });

    // Módulo: Agenda
    // Tela: agenda.tsx (calendário de cobranças).
    Route::get('/agenda', [AgendaController::class, 'index'])->name('agenda');

    // Páginas Estáticas
    // Tela: importar.tsx. importResumo é o resumo da última importação (flash).
    Route::get('/importar', fn () => inertia('FunctionsApp/importar', [
        'importResumo' => session('importResumo'),
    ]))->name('importar');

    // Tela: ajuda.tsx (menu do usuário > Ajuda).
    Route::get('/ajuda', fn () => inertia('FunctionsApp/ajuda'))->name('ajuda');

    // Módulo: Importação
    // Botão de enviar o CSV da tela Importar.
    Route::post('/importar-dados', [ImportacaoController::class, 'store'])
        ->middleware('throttle:importacao')
        ->name('importar-dados.store');
});

/* ------------------------------------------------------------------ */
/* Rotas Exclusivas para Administradores */
/* ------------------------------------------------------------------ */

Route::middleware(['auth', 'can:is-admin', 'throttle:web-actions'])->group(function () {

    // Ajuda: Documentação do TCC (download restrito a administradores)
    // Botão de download da documentação na tela Ajuda (só admin).
    Route::get('/ajuda/documentacao-tcc', function () {
        return response()->download(
            storage_path('app/private/documentacao-tcc.docx'),
            'Documentacao-TCC-PayFlow.docx'
        );
    })->name('ajuda.documentacao-tcc');

    // Módulo: Auditoria
    // Tela Auditoria (auditoria.tsx), aberta pelo menu do usuário: log de quem
    // criou/editou/excluiu/estornou/restaurou o quê. Filtros pela query string.
    Route::get('/auditoria', [AuditoriaController::class, 'index'])->name('auditoria');

    // Módulo: Seguradoras
    // Tela Seguradoras (seguradoras.tsx): cards, modal de cadastro e modal de perfil.
    Route::prefix('seguradoras')->group(function () {
        Route::get('/', [SeguradoraController::class, 'index'])->name('seguradoras');
        Route::post('/', [SeguradoraController::class, 'store']);
        Route::put('/{id}', [SeguradoraController::class, 'update'])->name('seguradoras.update');
        Route::delete('/{id}', [SeguradoraController::class, 'destroy'])->name('seguradoras.destroy');
    });

    // Módulo: Ramos (das seguradoras) — antes existiam controller e service,
    // mas nenhuma rota apontava pra eles: não tinha como editar ou adicionar
    // ramo numa seguradora já cadastrada pela tela.
    // Seção de ramos do modal de perfil da seguradora (tela Seguradoras).
    Route::prefix('ramos')->group(function () {
        Route::post('/', [RamosController::class, 'store'])->name('ramos.store');
        Route::put('/{id}', [RamosController::class, 'update'])->name('ramos.update');
        Route::delete('/{id}', [RamosController::class, 'destroy'])->name('ramos.destroy');
    });

    // Módulo: Notificações
    // Tela Notificações (notificacoes.tsx): cards (hoje, enviados, pendentes,
    // falhas), "Histórico de Notificações", aba de automações e modal de envio.
    // Os filtros do histórico vão na query string do próprio GET /; /filtrar
    // só redireciona para lá (URL antiga).
    Route::prefix('/notificacoes')->group(function () {
        Route::get('/', [NotificacoesController::class, 'index'])->name('notificacoes');
        Route::post('/', [NotificacoesController::class, 'store']);
        Route::get('/filtrar', [NotificacoesController::class, 'filtrar']);
    });

    // Módulo: Tipos de Notificação
    // Seção de tipos do modal de configurações da tela Notificações. O GET não é
    // usado por nenhuma tela hoje.
    Route::prefix('/tipo_notificacoes')->group(function () {
        Route::get('/', [TipoNotificacoesController::class, 'index']);
        Route::post('/', [TipoNotificacoesController::class, 'store']);
        Route::patch('/{id}', [TipoNotificacoesController::class, 'update']);
    });

    // Módulo: Automações
    // Modal de configurações e aba "Automações" da tela Notificações. GET e PUT
    // não são usados por nenhuma tela hoje.
    Route::prefix('/automacoes')->group(function () {
        Route::get('/', [AutomacoesController::class, 'index']);
        Route::post('/', [AutomacoesController::class, 'store']);
        Route::put('/{id}', [AutomacoesController::class, 'update']);
        Route::patch('/{id}/toggle', [AutomacoesController::class, 'toggle']);
        Route::delete('/{id}', [AutomacoesController::class, 'destroy']);
    });

    // Administração
    // Tela Administração (administracao.tsx): usuários e listas de pendências.
    Route::prefix('/administracao')->group(function () {
        Route::get('/usuarios', [UserController::class, 'index'])->name('users');
        Route::post('/usuarios', [UserController::class, 'store']);
        Route::put('/usuarios/{id}', [UserController::class, 'update']);
        Route::delete('/usuarios/{id}', [UserController::class, 'destroy']);
    });
});

require __DIR__.'/settings.php';
