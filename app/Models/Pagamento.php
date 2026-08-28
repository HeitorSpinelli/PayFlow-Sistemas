<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\Apolice;
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
    ];

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
