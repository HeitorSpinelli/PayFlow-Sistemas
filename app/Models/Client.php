<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Client extends Model
{
    //Modelo do cliente, com os campos necessários para pessoa física e jurídica

    protected $fillable = [
        'nome',
        'tipo_pessoa',
        'cpf_cnpj',
        'data_fundacao',
        'email',
        'telefone',
        'endereco',
        'cidade',
        'estado',
        'cep',
        'status'
    ];
}
