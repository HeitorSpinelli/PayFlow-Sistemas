<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\Apolice;

class Segurado extends Model
{
    public function apolices(){
        return $this->hasMany(apolices::class, 'cliente_id');
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