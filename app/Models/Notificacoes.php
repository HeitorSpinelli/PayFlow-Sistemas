<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * Cada notificação enviada (manual ou automática) a um segurado, com status
 * Pendente/Enviado/Falha. Aparece no "Histórico de Notificações" e nos cards
 * da tela Notificações, e no card "Notificações" do Dashboard.
 */
class Notificacoes extends Model
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
        'status',
        'erro',
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

    /**
     * Tipo da notificação (vira o assunto do e-mail).
     */
    public function tipoNotificacao()
    {
        return $this->belongsTo(TipoNotificacao::class, 'tipo_notificacao_id');
    }
}
