<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\Apolices;

class Segurado extends Model
{
    use HasFactory;

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

    protected $casts = [
        'data_nascimento_fundacao' => 'date'
    ];

    protected $appends = ['status'];

    public function apolices(): HasMany
    {
        return $this->hasMany(Apolice::class, 'cliente_id');
    }

    public function getStatusAttribute(): string
{
    // 1. Se o segurado não tiver apólices cadastradas
    if ($this->apolices->isEmpty()) {
        return 'Inativo';
    }

    $hoje = \Carbon\Carbon::today();

    // 2. Verifica se tem alguma apólice vigente
    $temApoliceVigente = $this->apolices->contains(function ($apolice) use ($hoje) {
        return $apolice->fim_vigencia && $apolice->fim_vigencia->gte($hoje);
    });

    if ($temApoliceVigente) {
        return 'Ativo';
    }

    // 3. Se tem apólices, mas nenhuma está vigente (todas vencidas)
    return 'Para Renovar';
}
}
