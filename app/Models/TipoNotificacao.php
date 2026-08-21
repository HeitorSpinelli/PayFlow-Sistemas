<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TipoNotificacao extends Model
{
    protected $fillable = [
        'nome_notificacao',
        'ativo',
    ];
    
}
