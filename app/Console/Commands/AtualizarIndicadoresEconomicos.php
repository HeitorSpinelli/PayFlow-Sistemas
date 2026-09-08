<?php

namespace App\Console\Commands;

use App\Services\Financeiro\IndicadorEconomicoService;
use Illuminate\Console\Command;

class AtualizarIndicadoresEconomicos extends Command
{
    protected $signature = 'indicadores:atualizar';

    protected $description = 'Busca a Selic e o IPCA mais recentes na API do Banco Central e salva no banco.';

    public function handle(IndicadorEconomicoService $service): void
    {
        $this->info('Buscando indicadores econômicos no Banco Central...');

        $service->atualizarTodos();

        $selic = $service->obterUltimoValor('selic');
        $ipca = $service->obterUltimoValor('ipca_12m');

        $this->info("Selic atual: " . ($selic ?? 'indisponível'));
        $this->info("IPCA acumulado 12m: " . ($ipca ?? 'indisponível'));
        $this->info("Taxa legal de mora (Selic - IPCA): " . ($service->calcularTaxaLegalMora() ?? 'indisponível'));
    }
}