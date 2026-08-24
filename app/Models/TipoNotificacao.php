<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TipoNotificacao extends Model
{

    protected $table = 'tipos_notificacao';

    protected $fillable = [
        'nome_notificacao',
        'ativo',
    ];
}
