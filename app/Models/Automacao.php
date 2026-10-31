<?php

namespace App\Models;

use App\Models\Concerns\Auditavel;
use Illuminate\Database\Eloquent\Model;

/**
 * Automação de notificação (condição + dias + canal + mensagem), criada no
 * modal de configurações da tela Notificações e executada diariamente pelo
 * job ProcessarAutomacoes.
 */
class Automacao extends Model
{
    use Auditavel;

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

    /* Log de auditoria (trait Auditavel) */

    public function auditoriaModulo(): string
    {
        return 'Automação';
    }

    public function auditoriaDescricao(): string
    {
        $tipo = $this->tipoNotificacao()->value('nome_notificacao');

        return 'Automação'.($tipo ? ' — '.$tipo : ' #'.$this->getKey());
    }
}
