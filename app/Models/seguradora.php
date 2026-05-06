<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class seguradora extends Model
{
    //Seguradoras parceiras, como Porto Seguro, Bradesco Seguros, SulAmérica, etc.
    protected $table = 'seguradoras';
    protected $fillable = [
        'nome_fantasia', // Nome da seguradora
        'razao_social', // Razão social da seguradora
        'cnpj', // CNPJ da seguradora
        'contato_nome', // Informações de contato da seguradora
        'email_suporte', // Email de contato da seguradora
    ];
}
