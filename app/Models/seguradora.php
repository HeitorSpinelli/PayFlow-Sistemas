<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Seguradora extends Model
{
    //Seguradoras parceiras, como Porto Seguro, Bradesco Seguros, SulAmérica, etc.
    protected $table = 'seguradoras';

    public function ramos()
    {
        return $this->hasMany(Ramo::class, 'seguradora_id', 'id');
    }

    public function segurados()
    {
        return $this->hasMany(Segurado::class, 'seguradora_id', 'id');
    }

    protected $fillable = [
        'nome_fantasia',
        'razao_social',
        'cnpj',
        'contato_nome',
        'email_suporte',
        'ramo_id',
    ];
}
