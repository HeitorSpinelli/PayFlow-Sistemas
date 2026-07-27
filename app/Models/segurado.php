<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory; // 1. Import da trait HasFactory
use Illuminate\Database\Eloquent\Model;
use App\Models\Apolices; // Ajuste no nome da Model de Apólices

class Segurado extends Model
{
    use HasFactory; // 2. HasFactory com H maiúsculo

    public function apolices()
    {
        return $this->hasMany(Apolices::class, 'cliente_id');
    }

    // Defina que o atributo customizado 'status' deve ser incluído na serialização do modelo
    protected $appends = ['status'];

    public function getStatusAttribute(): string
    {
        // Se não tem nenhuma apólice, está inativo
        if (!$this->apolices()->exists()) {
            return 'Inativo';
        }

        // Verifica se existe alguma apólice cuja vigência ainda não terminou
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
