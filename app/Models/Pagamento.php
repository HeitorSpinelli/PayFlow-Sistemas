<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\Apolice;
use App\Models\User;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * Pagamento de uma parcela (tabela pagamentos). Linhas da tela Pagamentos,
 * cupom impresso e CSVs. Soft delete = pagamento estornado.
 */
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

    /**
     * Usuário que lançou o pagamento — coluna "Registrado por" da Lista de Pagamentos.
     */
    public function registradoPor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'registrado_por');
    }

    /**
     * Usuário que estornou (excluiu) o pagamento.
     */
    public function estornadoPor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'estornado_por');
    }

    /**
     * Apólice do pagamento.
     */
    public function apolice(): BelongsTo
    {
        return $this->belongsTo(Apolice::class, 'apolice_id');
    }

    /**
     * Busca (cliente, CPF/CNPJ, número da apólice) e filtro de forma de
     * pagamento. Usado no CSV do botão "Exportar" da tela Pagamentos; a tabela da
     * tela aplica as mesmas condições em SQL direto (pagamentoController::show).
     */
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
