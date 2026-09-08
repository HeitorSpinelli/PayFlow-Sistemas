<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

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