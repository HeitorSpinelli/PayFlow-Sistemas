<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

use App\Console\Commands\CancelarApolicesPorAtrasoDaPrimeiraParcela;
use App\Console\Commands\VerificarInadimplenciaParcelas;
use App\Jobs\AtualizarParcelasVencidas;
use App\Jobs\ProcessarAutomacoes;
use Illuminate\Support\Facades\Schedule;

// Roda antes do ProcessarAutomacoes: precisa marcar as parcelas vencidas
// antes da automação de notificação de atraso rodar, senão ela não acha nada.
Schedule::job(new AtualizarParcelasVencidas)->dailyAt('07:00');

// Cancelamento por atraso da 1ª parcela (Lei 15.040/2024, art. 21) — sem
// aviso prévio, diferente da suspensão de 30 dias da 2ª parcela em diante.
// Precisa rodar todo dia: sem agendamento, essa exigência legal nunca era
// aplicada automaticamente.
Schedule::command(CancelarApolicesPorAtrasoDaPrimeiraParcela::class)->dailyAt('07:05');

Schedule::command(VerificarInadimplenciaParcelas::class)->dailyAt('07:15');
Schedule::job(new ProcessarAutomacoes)->dailyAt('08:00');
