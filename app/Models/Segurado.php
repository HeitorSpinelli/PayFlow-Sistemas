<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Segurado extends Model
{
    protected $table = 'segurados';
    use SoftDeletes;

    protected $fillable = [
        'nome_completo',
        'tipo_pessoa',
        'cpf_cnpj',
        'data_nascimento_fundacao',
        'email',
        'telefone_fixo',
        'celular_whatsapp',
        'endereco',
        'cidade',
        'estado',
        'cep',
        'observacoes'
    ];

    public function apolices()
    {
        return $this->hasMany(Apolice::class, 'cliente_id');
    }

    public function getStatusAttribute(): string
    {
        // Se a relação 'apolices' já foi trazida com with('apolices'), usa ela em memória
        if ($this->relationLoaded('apolices')) {
            return $this->apolices->isNotEmpty() ? 'Ativo' : 'Inativo';
        }

        // Caso contrário, faz a verificação rápida
        return $this->apolices()->exists() ? 'Ativo' : 'Inativo';
    }

    public function scopeFilter($query, array $filters)
    {
        // Bloco de busca — agora isolado dentro de parênteses
        $query->when($filters['busca'] ?? null, function ($q, $busca) {
            $buscaLimpa = preg_replace('/\D/', '', $busca);

            $q->where(function ($subQuery) use ($busca, $buscaLimpa) {
                $subQuery->where('nome_completo', 'iLike', "%{$busca}%");

                if (!empty($buscaLimpa)) {
                    $subQuery->orWhere('cpf_cnpj', 'iLike', "%{$busca}%")
                        ->orWhereRaw("REGEXP_REPLACE(cpf_cnpj, '[^0-9]', '', 'g') iLike ?", ["%{$buscaLimpa}%"]);
                } else {
                    $subQuery->orWhere('cpf_cnpj', 'iLike', "%{$busca}%");
                }
            });
        });

        // Bloco de status — continua igual, fora do agrupamento acima
        $query->when($filters['status'] ?? null, function ($q, $status) {
            if ($status === 'Ativos') {
                $q->has('apolices');
            } elseif ($status === 'Inativos') {
                $q->doesntHave('apolices');
            }
        });
    }


    protected $appends = ['status'];
}
