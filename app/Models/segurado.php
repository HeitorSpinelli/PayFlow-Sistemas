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
        //Se segurado nn tiver apolices retorna status Inativo
        if (!$this->apolices->isEmpty()) {
            return 'Inativo';
        }

        $temApoliceVigente = $this->apolices
            ->where('fim_vigencia', '>=', now()->today())
            ->isNotEmpty();

        return $temApoliceVigente ? 'Ativo' : 'Para Renovar';
    }
}
