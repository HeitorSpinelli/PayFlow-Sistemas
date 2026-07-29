<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model; // Corrigido o ;; duplo
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Database\Factories\ApoliceFactory; // Importa a Factory correspondente

class apolices extends Model
{
    use HasFactory;

    /**
     * Define explicitamente qual Factory essa Model deve utilizar
     */
    protected static function newFactory()
    {
        return ApoliceFactory::new();
    }

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
        if (!$this->fim_vigencia || !$this->inicio_vigencia) {
            return 'N/A';
        }

        $hoje = Carbon::today();

        $fimVigencia = Carbon::parse($this->fim_vigencia);
        $inicioVigencia = Carbon::parse($this->inicio_vigencia);

        if ($hoje->gt($fimVigencia)) {
            return 'Para Renovar';
        }

        if ($hoje->between($inicioVigencia, $fimVigencia)) {
            return 'Vigente';
        }

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

    public function cliente(): BelongsTo
    {
        return $this->belongsTo(Segurado::class, 'cliente_id');
    }
}