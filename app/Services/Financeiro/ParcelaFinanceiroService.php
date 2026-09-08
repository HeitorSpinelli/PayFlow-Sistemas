<?php

namespace App\Services\Financeiro;

use App\Models\Parcelas;

class ParcelaFinanceiroService
{
    // Multa fixa por atraso, aplicada uma única vez — teto máximo legal
    // para relações de consumo (Código de Defesa do Consumidor, art. 52, §1º).
    private const PERCENTUAL_MULTA = 0.02; // 2%

    // Taxa usada SOMENTE se o sistema nunca conseguiu buscar Selic/IPCA
    // na API do BCB (nem uma vez, desde a implantação). Equivale
    // aproximadamente a 1% ao mês — referência histórica do art. 161,
    // §1º do CTN. Não deveria disparar em operação normal.
    private const TAXA_ANUAL_FALLBACK = 12.0;

    protected IndicadorEconomicoService $indicadorService;

    public function __construct(IndicadorEconomicoService $indicadorService)
    {
        $this->indicadorService = $indicadorService;
    }

    /**
     * Calcula o valor atualizado de uma parcela, somando multa (fixa, 2%)
     * e juros de mora (proporcionais aos dias de atraso) ao valor original.
     * Se a parcela não estiver atrasada, devolve os acréscimos zerados.
     */
    public function calcular(Parcelas $parcela): array
    {
        $diasAtraso = $parcela->diasEmAtraso();
        $valorOriginal = (float) $parcela->valor_parcela;

        if ($diasAtraso === 0) {
            return [
                'dias_atraso' => 0,
                'valor_original' => $valorOriginal,
                'multa' => 0.0,
                'juros' => 0.0,
                'valor_total' => $valorOriginal,
            ];
        }

        $multa = round($valorOriginal * self::PERCENTUAL_MULTA, 2);
        $juros = round($valorOriginal * $this->taxaDiaria() * $diasAtraso, 2);

        return [
            'dias_atraso' => $diasAtraso,
            'valor_original' => $valorOriginal,
            'multa' => $multa,
            'juros' => $juros,
            'valor_total' => round($valorOriginal + $multa + $juros, 2),
        ];
    }

    /**
     * Converte a taxa legal anual (Selic - IPCA) em taxa diária, usando
     * divisão SIMPLES (não composta): taxa anual / 12 / 30. É assim que
     * juros de mora são calculados na prática no Brasil (diferente de
     * juros de investimento, mora não capitaliza diariamente).
     */
    private function taxaDiaria(): float
    {
        $taxaAnual = $this->indicadorService->calcularTaxaLegalMora() ?? self::TAXA_ANUAL_FALLBACK;

        $taxaMensal = $taxaAnual / 12;
        $taxaDiariaPercentual = $taxaMensal / 30;

        return $taxaDiariaPercentual / 100;
    }
}