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
        // 1. Se não houver fim de vigência cadastrado, define um status padrão
        if (!$this->fim_vigencia || !$this->inicio_vigencia) {
            return 'N/A';
        }

        $hoje = Carbon::today();

        // Garante que ambos os lados sejam instâncias do Carbon
        $fimVigencia = Carbon::parse($this->fim_vigencia);
        $inicioVigencia = Carbon::parse($this->inicio_vigencia);

        // Se a data de hoje já passou do fim da vigência
        if ($hoje->gt($fimVigencia)) {
            return 'Para Renovar';
        }

        // Se a data de hoje está dentro do período de vigência
        if ($hoje->between($inicioVigencia, $fimVigencia)) {
            return 'Vigente';
        }

        // Caso o início seja no futuro
        if ($hoje->lt($inicioVigencia)) {
            return 'A Iniciar';
        }

        return 'Pendente';
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
