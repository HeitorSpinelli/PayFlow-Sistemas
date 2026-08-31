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
        'bairro',
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
        // Ativo = tem pelo menos uma apólice DENTRO da vigência (não só "tem apólice")
        return $this->apolices()->ativas()->exists() ? 'Ativo' : 'Inativo';
    }

    public function scopeFilter($query, array $filters)
    {
        // Bloco de busca — isolado dentro de parênteses
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

        // Bloco de status — agora usando whereHas/whereDoesntHave com o scope ativas()
        // em vez de has/doesntHave, que só checavam "tem qualquer apólice"
        $query->when($filters['status'] ?? null, function ($q, $status) {
            if ($status === 'Ativos') {
                $q->whereHas('apolices', function ($sub) {
                    $sub->ativas();
                });
            } elseif ($status === 'Inativos') {
                $q->whereDoesntHave('apolices', function ($sub) {
                    $sub->ativas();
                });
            }
        });
    }

    protected $appends = ['status'];
}
