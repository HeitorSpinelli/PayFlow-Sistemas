<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

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

    //isso daqui e um atalho para conectar a apolice com segurado,
    // assim eu não preciso fazer um query manual para buscar o cliente
    //so preciso usar o apolice->cliente, moro?
public function cliente(): BelongsTo
{
    return $this->belongsTo(segurado::class, 'cliente_id');
}

}
