<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class apolices extends Model
{
    //modelo da apólice, com os campos necessários para o cadastro e gerenciamento das apólices

    protected $fillable = [
        'numero_apolice',
        'cliente_id',
        'seguradora_id',
        'ramo_id',
        'valor_premio_total',
        'valor_cobertura',
        'quantidade_parcelas',
        'forma_pagamento',
        'inicio_vigencia',
        'fim_vigencia',
        'status',
        'observacoes'
    ];

}
