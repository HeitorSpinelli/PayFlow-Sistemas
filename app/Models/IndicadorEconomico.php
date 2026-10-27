<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * Histórico de Selic e IPCA 12m buscados no Banco Central. Sem tela própria:
 * alimenta o cálculo de juros de mora (valor sugerido no modal "Registrar
 * Pagamento").
 */
class IndicadorEconomico extends Model
{
    protected $table = 'indicadores_economicos';

    protected $fillable = [
        'indicador',
        'valor',
        'data_referencia',
        'atualizado_em',
    ];

    protected $casts = [
        'valor' => 'float',
        'data_referencia' => 'date',
        'atualizado_em' => 'datetime',
    ];
}