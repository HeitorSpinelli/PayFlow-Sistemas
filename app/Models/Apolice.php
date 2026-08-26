<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Models\Parcelas;

class Apolice extends Model
{
    protected $table = 'apolices';
    use SoftDeletes;

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

    public function scopeFilter($query, array $filters)
    {
        $query->when($filters['busca'] ?? null, function ($q, $busca) {
            $buscaLimpa = preg_replace('/\D/', '', $busca);
            $q->where(function ($query) use ($busca, $buscaLimpa) {
                // Busca por número da apólice na tabela apolices
                $query->where('numero_apolice', 'iLike', "%{$busca}%")
                    // Busca por nome ou documento na tabela segurados (cliente)
                    ->orWhereHas('cliente', function ($sub) use ($busca, $buscaLimpa) {
                        $sub->where('nome_completo', 'iLike', "%{$busca}%")
                            ->orWhere('cpf_cnpj', 'iLike', "%{$busca}%");
                        if (!empty($buscaLimpa)) {
                            $sub->orWhereRaw("REGEXP_REPLACE(cpf_cnpj, '[^0-9]', '', 'g') iLike ?", ["%{$buscaLimpa}%"]);
                        }
                    });
            });
        });
        $query->when($filters['status'] ?? null, function ($q, $status) {
            if ($status === 'Vigente') {
                $q->where('inicio_vigencia', '<=', now())
                    ->where('fim_vigencia', '>=', now());
            } elseif ($status === 'A Iniciar') {
                $q->where('inicio_vigencia', '>', now());
            } elseif ($status === 'Para Renovar') {
                $q->where('fim_vigencia', '<', now());
            }
        });
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

    public function seguradora()
    {
        return $this->belongsTo(Seguradora::class, 'seguradora_id');
    }

    public function ramo()
    {
        return $this->belongsTo(Ramo::class, 'ramo_id');
    }
    public function pagamentos():HasMany
    {
        return $this->hasMany(Pagamento::class, 'apolice_id');
    }
    public function parcelas():HasMany
    {
        return $this->hasMany(parcelas::class, 'apolice_id');
    }
}
