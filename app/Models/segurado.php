<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\Apolice;

class Segurado extends Model
{
    public function apolices(){
        return $this->hasMany(apolices::class, 'cliente_id');
    }

    public function status(){
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