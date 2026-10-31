<?php

namespace App\Models;

use App\Models\Concerns\Auditavel;
use Illuminate\Database\Eloquent\Model;

/**
 * Tipo de notificação (nome vira o assunto do e-mail). Gerenciado no modal de
 * configurações da tela Notificações; tipos desativados param as automações.
 */
class TipoNotificacao extends Model
{
    use Auditavel;


    protected $table = 'tipos_notificacao';

    protected $fillable = [
        'nome_notificacao',
        'ativo',
    ];

    /* Log de auditoria (trait Auditavel) */

    public function auditoriaModulo(): string
    {
        return 'Tipo de notificação';
    }

    public function auditoriaDescricao(): string
    {
        return (string) $this->nome_notificacao;
    }
}
