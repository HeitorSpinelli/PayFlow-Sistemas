<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Segurado extends Model
{
    protected $table = 'segurados';

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
        //Se usuario digitou algo no campo que seja diferente de nulo, ele entra no function anonimo
        // onde define q onde nome for parecidos ao busca ou cpf_cnpj
        $query->when($filters['busca'] ?? null, function ($q, $busca) {
            $buscaLimpa = preg_replace('/\D/', '', $busca);
            $q->where('nome_completo', 'iLike', "%{$busca}%");
            if (!empty($buscaLimpa)) {
                $q->orWhere('cpf_cnpj', 'iLike', "%{$busca}%")
                    ->orWhereRaw("REGEXP_REPLACE(cpf_cnpj, '[^0-9]', '', 'g') iLike ?", ["%{$buscaLimpa}%"]);
            } else {
                $q->orWhere('cpf_cnpj', 'iLike', "%{$busca}%");
            }
        });
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
