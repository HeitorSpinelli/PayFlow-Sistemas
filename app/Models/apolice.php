<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Apolice extends Model
{
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

    public function scopeAtivas($query)
    {
        return $query->where('inicio_vigencia', '<=', now())
            ->where('fim_vigencia', '>=', now());
    }

    public function scopeVencidasOuParaRenovar($query)
    {
        return $query->where('fim_vigencia', '<', now());
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
