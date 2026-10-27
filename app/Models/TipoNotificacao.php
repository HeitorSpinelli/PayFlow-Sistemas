<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * Tipo de notificação (nome vira o assunto do e-mail). Gerenciado no modal de
 * configurações da tela Notificações; tipos desativados param as automações.
 */
class TipoNotificacao extends Model
{

    protected $table = 'tipos_notificacao';

    protected $fillable = [
        'nome_notificacao',
        'ativo',
    ];
}
