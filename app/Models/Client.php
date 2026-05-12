<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Client extends Model
{
    
    protected $fillable = [
        'tipo_pessoa',              
        'nome_completo',            
        'email',
        'telefone',
        'cpf_cnpj',               
        'data_nascimento_fundacao', 
        'endereco',
        'cidade',
        'estado',
        'cep',
        'status',
    ];
}