<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Seguradora extends Model
{
    // Seguradoras parceiras, como Porto Seguro, Bradesco Seguros, SulAmérica, etc.
    protected $table = 'seguradoras';

    protected $fillable = [
        'nome_fantasia',
        'razao_social',
        'cnpj',
        'contato_nome',
        'email_suporte',
    ];

    public function ramos()
    {

        return $this->hasMany(Ramo::class, 'seguradora_id');
    }
}
