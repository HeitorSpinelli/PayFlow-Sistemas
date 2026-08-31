<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

use App\Jobs\AtualizarParcelasVencidas;
use App\Jobs\ProcessarAutomacoes;
use Illuminate\Support\Facades\Schedule;

// Roda antes do ProcessarAutomacoes: precisa marcar as parcelas vencidas
// antes da automação de notificação de atraso rodar, senão ela não acha nada.
Schedule::job(new AtualizarParcelasVencidas)->dailyAt('07:00');
Schedule::job(new ProcessarAutomacoes)->dailyAt('08:00');
