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

    // Este é o Accessor (Padrão Laravel 9+)
    public function getStatusAttribute(): string
    {
        return $this->apolices()->exists() ? 'Ativo' : 'Inativo';
    }
    
    protected $fillable = [              
        'nome_completo',
        'tipo_pessoa',
        'cpf_cnpj',                        
        'data_nascimento_fundacao', 
        'email',
        'telefone_fixo',
        'celular_Whatsapp',
        'endereco',
        'cidade',
        'estado',
        'cep',
        'observacoes'
    ];
}