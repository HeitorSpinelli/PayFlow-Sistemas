<?php

namespace App\Jobs;

use App\Models\Parcelas;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class AtualizarParcelasVencidas implements ShouldQueue
{
    use Queueable;

    /**
     * Create a new job instance.
     */
    public function __construct()
    {
        //
    }

    /**
     * Marca como 'vencida' toda parcela ainda em aberto cuja data de
     * vencimento já passou. Sem isso, nada no sistema transiciona uma
     * parcela pra 'vencida' — o card "Clientes Devedores" do dashboard
     * e a automação de notificação de atraso dependem desse status e
     * nunca encontram nada.
     */
    public function handle(): void
    {
        Parcelas::where('status_pagamento', 'em_aberto')
            ->whereDate('data_vencimento', '<', now())
            ->update(['status_pagamento' => 'vencida']);
    }
}
