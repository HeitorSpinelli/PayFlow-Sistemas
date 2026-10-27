<?php

namespace App\Console\Commands;

use App\Services\Financeiro\IndicadorEconomicoService;
use Illuminate\Console\Command;

/**
 * Comando agendado (06:30) que atualiza Selic e IPCA. Sem tela; afeta o valor
 * com juros sugerido no modal "Registrar Pagamento".
 */
class AtualizarIndicadoresEconomicos extends Command
{
    protected $signature = 'indicadores:atualizar';

    protected $description = 'Busca a Selic e o IPCA mais recentes na API do Banco Central e salva no banco.';

    /**
     * Chama IndicadorEconomicoService::atualizarTodos().
     */
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