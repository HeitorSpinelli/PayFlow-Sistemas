<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * Automação de notificação (condição + dias + canal + mensagem), criada no
 * modal de configurações da tela Notificações e executada diariamente pelo
 * job ProcessarAutomacoes.
 */
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

    /**
     * Usuário que criou a automação.
     */
    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /**
     * Tipo de notificação usado como assunto do e-mail disparado.
     */
    public function tipoNotificacao()
    {
        return $this->belongsTo(TipoNotificacao::class, 'tipo_notificacao_id');
    }
}
