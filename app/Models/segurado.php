<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\Apolices;

class Segurado extends Model
{
    use HasFactory;

    public function apolices()
    {
        return $this->hasMany(Apolices::class, 'cliente_id');
    }

    protected $appends = ['status'];

    // MANTENHA ISSO: É usado para mostrar o texto na tela do cliente
    public function getStatusAttribute(): string
    {
        if (!$this->apolices()->exists()) {
            return 'Inativo';
        }

        $temApoliceVigente = $this->apolices()
            ->where('fim_vigencia', '>=', now()->today())
            ->exists();

        return $temApoliceVigente ? 'Ativo' : 'Para Renovar';
    }

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
}
