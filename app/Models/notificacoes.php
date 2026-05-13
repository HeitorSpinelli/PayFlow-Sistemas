<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class notificacoes extends Model
{
    protected $table = 'notificacoes';
    protected $fillable = [
        'tipo_noticacao',
        'segurado_id',
        'canal',
        'assunto_email',
        'mensagem'
    ];
}
