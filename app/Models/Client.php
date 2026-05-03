<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Client extends Model
{
    //Modelo do cliente, com os campos necessários para pessoa física e jurídica

    protected $fillable = [
        'tipo_cliente',
        'nome',
        'email',
        'telefone',
        'cpf',
        'data_nascimento',
        'cnpj',
        'data_fundacao',
    ];
}
