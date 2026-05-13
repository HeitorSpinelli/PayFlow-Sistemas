<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Client extends Model
{
    
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
        'status',
        'observacoes'
    ];
}