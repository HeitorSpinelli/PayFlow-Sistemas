<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class notificacoes extends Model
{
    protected $table = 'notificacoes';

    protected $fillable = [
        'user_id',
        'segurado_id',
        'tipo_notificacao_id',
        'canal',
        'mensagem',
        'data_envio',
        'data_agendamento',
        'status'
    ];

    // Relacionamento com o usuário que enviou
    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    // Relacionamento com o segurado (destinatário)
    public function segurado()
    {
        return $this->belongsTo(Segurado::class, 'segurado_id');
    }

    public function tipoNotificacao(){
        return $this->belongsTo(TipoNotificacao::class, 'tipo_notificacao_id');
    }
}