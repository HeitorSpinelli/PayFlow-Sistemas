<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Ramo extends Model
{
    //Ramos de cada contrato de seguro, como automóvel, residencial, vida, saúde, etc.
    protected $table = 'ramos';
    protected $fillable = [
        'nome_ramo',
        'seguradora_id'
    ];
}
