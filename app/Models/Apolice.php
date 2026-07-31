<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Database\Factories\ApoliceFactory;

class Apolice extends Model
{
    use HasFactory;

    protected static function newFactory()
    {
        return ApoliceFactory::new();
    }

    protected $table = 'apolices';

    protected $appends = ['status_vigencia'];

    protected $casts = [
        'inicio_vigencia' => 'date',
        'fim_vigencia' => 'date',
    ];

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

    // --- Relacionamentos Eloquent ---

    public function cliente(): BelongsTo
    {
        return $this->belongsTo(Segurado::class, 'cliente_id');
    }

    public function ramo(): BelongsTo
    {
        return $this->belongsTo(Ramo::class, 'ramo_id');
    }

    public function seguradora(): BelongsTo
    {
        return $this->belongsTo(Seguradora::class, 'seguradora_id');
    }
}