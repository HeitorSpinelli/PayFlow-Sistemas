<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

use App\Console\Commands\AtualizarIndicadoresEconomicos;
use App\Console\Commands\CancelarApolicesPorAtrasoDaPrimeiraParcela;
use App\Console\Commands\VerificarInadimplenciaParcelas;
use App\Jobs\AtualizarParcelasVencidas;
use App\Jobs\ProcessarAutomacoes;
use Illuminate\Support\Facades\Schedule;

// Selic/IPCA do dia. Estava declarado em routes/web.php, que só é carregado
// no ciclo HTTP — o `schedule:run` nunca enxergava essa tarefa, e por isso a
// tabela de indicadores estava vazia e todo juros de mora caía no fallback
// de 12% a.a. Roda primeiro porque o cálculo das parcelas depende dele.
Schedule::command(AtualizarIndicadoresEconomicos::class)->dailyAt('06:30');

// Roda antes do ProcessarAutomacoes: precisa marcar as parcelas vencidas
// antes da automação de notificação de atraso rodar, senão ela não acha nada.
// onConnection('sync') é obrigatório aqui: QUEUE_CONNECTION=database e NÃO
// existe worker no deploy (o Dockerfile sobe só o Apache; o `queue:listen` do
// composer.json é do script `dev`, local). Sem isso, Schedule::job apenas
// INSERE uma linha na tabela `jobs` que ninguém consome — o schedule:run
// reportava sucesso todo dia e nenhuma parcela era marcada como vencida.
// Com 'sync' a tarefa roda no próprio processo do scheduler, igual aos
// Schedule::command vizinhos. Se algum dia entrar um worker de verdade no
// deploy, basta remover esta chamada.
Schedule::job((new AtualizarParcelasVencidas)->onConnection('sync'))->dailyAt('07:00');

// Cancelamento por atraso da 1ª parcela (Lei 15.040/2024, art. 21) — sem
// aviso prévio, diferente da suspensão de 30 dias da 2ª parcela em diante.
// Precisa rodar todo dia: sem agendamento, essa exigência legal nunca era
// aplicada automaticamente.
Schedule::command(CancelarApolicesPorAtrasoDaPrimeiraParcela::class)->dailyAt('07:05');

Schedule::command(VerificarInadimplenciaParcelas::class)->dailyAt('07:15');
// Mesmo motivo do AtualizarParcelasVencidas acima: sem 'sync' esta automação
// nunca executava, e as notificações de vencimento/atraso nunca saíam.
Schedule::job((new ProcessarAutomacoes)->onConnection('sync'))->dailyAt('08:00');
