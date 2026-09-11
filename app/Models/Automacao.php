<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Automacao extends Model
{
    protected $table = 'automacoes';

    protected $fillable = [
        'tipo_condicao',
        'user_id',
        'tipo_notificacao_id',
        'ativo',
        'dias',
        'intervalo_dias',
        'canal',
        'mensagem',
    ];

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function tipoNotificacao()
    {
        return $this->belongsTo(TipoNotificacao::class, 'tipo_notificacao_id');
    }
}
