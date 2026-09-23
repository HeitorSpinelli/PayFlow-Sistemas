<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\Apolice;
use App\Models\User;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\SoftDeletes;

class Pagamento extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'apolice_id',
        'parcela',
        'valor',
        'data_pagamento',
        'forma_pagamento',
        'status',
        'observacoes',
        // Preenchidos SEMPRE pelo PagamentoService a partir de auth()->id(),
        // nunca a partir do request — estão no $fillable só porque o service
        // usa create()/update() em massa. O Form Request não valida esses
        // campos, então um POST que os enviasse seria descartado pelo
        // validated() antes de chegar aqui.
        'registrado_por',
        'estornado_por',
    ];

    public function registradoPor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'registrado_por');
    }

    public function estornadoPor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'estornado_por');
    }

    public function apolice(): BelongsTo
    {
        return $this->belongsTo(Apolice::class, 'apolice_id');
    }

    public function scopeFilter(Builder $query, array $filters)
    {
        $query->when($filters['busca'] ?? null, function ($q, $busca) {
            $q->where(function ($sub) use ($busca) {
                $sub->whereHas('apolice.cliente', function ($cliente) use ($busca) {
                    $cliente->where('nome_completo', 'ilike', "%{$busca}%")
                        ->orWhere('cpf_cnpj', 'ilike', "%{$busca}%");
                })->orWhereHas('apolice', function ($apolice) use ($busca) {
                    $apolice->where('numero_apolice', 'ilike', "%{$busca}%");
                });
            });
        });

        $query->when($filters['forma_pagamento'] ?? null, function ($q, $forma) {
            $q->where('forma_pagamento', $forma);
        });
    }
}
