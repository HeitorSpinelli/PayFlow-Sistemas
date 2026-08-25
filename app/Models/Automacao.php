<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\User;
use App\Models\TipoNotificacao;

class Automacao extends Model
{

    protected $table = 'automacoes';

    protected $fillable = [
        'tipo_condicao',
        'user_id',
        'tipo_notificacao_id',
        'ativo',
        'dias',
        'canal',
        'mensagem'
    ];

    public function user(){
        return $this->belongsTo(User::class, 'user_id');
    }

    public function notificacoes(){
        return $this->belongsTo(TipoNotificacao::class, 'tipo_notificacao_id');
    }
}
