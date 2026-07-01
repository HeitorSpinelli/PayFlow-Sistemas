<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class apolices extends Model
{
    //modelo da apólice, com os campos necessários para o cadastro e gerenciamento das apólices

    protected $table = 'apolices';

    // Inclui o status_vigencia automaticamente na serialização (Inertia/React)
    protected $appends = ['status_vigencia'];

    // Garante que o Laravel trate os campos como objetos Carbon (datas)
    protected $casts = [
        'inicio_vigencia' => 'date',
        'fim_vigencia' => 'date',
    ];

    /**
     * Accessor para calcular o status da vigência em tempo real
     */
    public function getStatusVigenciaAttribute(): string
    {
        $hoje = Carbon::today();

        // Se a data de hoje já passou do fim da vigência
        if ($hoje->gt($this->fim_vigencia)) {
            return 'Para Renovar';
        }

        // Se a data de hoje está dentro do período de vigência
        if ($hoje->between($this->inicio_vigencia, $this->fim_vigencia)) {
            return 'Vigente';
        }

        // Caso a apólice tenha sido cadastrada mas o início seja no futuro
        if ($hoje->lt($this->inicio_vigencia)) {
            return 'A Iniciar';
        }

        return 'Indefinido';
    }

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
