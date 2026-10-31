<?php

namespace App\Models;

use App\Models\Concerns\Auditavel;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * Cliente (segurado) — tabela segurados. Tela Clientes, ficha impressa, e
 * dono das apólices em todo o sistema. Soft delete = cliente na lixeira
 * ("Clientes Inativos (Lixeira)" da tela Administração).
 */
class Segurado extends Model
{
    use Auditavel;

    protected $table = 'segurados';

    use SoftDeletes;

    protected $fillable = [
        'nome_completo',
        'razao_social',
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
        'observacoes',
    ];

    /**
     * Apólices do cliente (coluna apolices.cliente_id).
     */
    public function apolices()
    {
        return $this->hasMany(Apolice::class, 'cliente_id');
    }

    /**
     * Ativo = tem pelo menos uma apólice DENTRO da vigência (não só "tem
     * apólice"). Quando `apolices` já foi eager-loaded (ex: listagem de
     * clientes), reaproveita a coleção em memória em vez de rodar uma nova
     * query EXISTS por cliente — sem isso, cada linha da tabela de clientes
     * disparava sua própria consulta extra (N+1), mesmo com o with('apolices')
     * já feito no controller.
     *
     * Na tela: é o selo Ativo/Inativo da Lista de Clientes e da ficha impressa.
     */
    public function getStatusAttribute(): string
    {
        if ($this->relationLoaded('apolices')) {
            $hoje = now();
            $ativo = $this->apolices->contains(
                fn (Apolice $apolice) => $apolice->inicio_vigencia <= $hoje && $apolice->fim_vigencia >= $hoje
            );

            return $ativo ? 'Ativo' : 'Inativo';
        }

        return $this->apolices()->ativas()->exists() ? 'Ativo' : 'Inativo';
    }

    /**
     * Busca por nome/CPF/CNPJ e filtro Ativos/Inativos da tela Clientes
     * (SeguradoController::show).
     */
    public function scopeFilter($query, array $filters)
    {
        // Bloco de busca — isolado dentro de parênteses
        $query->when($filters['busca'] ?? null, function ($q, $busca) {
            $buscaLimpa = preg_replace('/\D/', '', $busca);

            $q->where(function ($subQuery) use ($busca, $buscaLimpa) {
                $subQuery->where('nome_completo', 'iLike', "%{$busca}%");

                if (! empty($buscaLimpa)) {
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

    /* Log de auditoria (trait Auditavel) */

    public function auditoriaModulo(): string
    {
        return 'Cliente';
    }

    public function auditoriaDescricao(): string
    {
        return (string) $this->nome_completo;
    }
}
