<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Uma linha do log de auditoria (tela Auditoria, só admin). Gravada pelo
 * AuditoriaService a partir dos eventos dos models que usam o trait
 * Auditavel; nunca editada nem apagada pela aplicação.
 */
class Auditoria extends Model
{
    protected $table = 'auditorias';

    // Só created_at: um registro de auditoria nunca é atualizado.
    public const UPDATED_AT = null;

    public const ACAO_CRIOU = 'criou';

    public const ACAO_EDITOU = 'editou';

    public const ACAO_EXCLUIU = 'excluiu';

    public const ACAO_ESTORNOU = 'estornou';

    public const ACAO_RESTAUROU = 'restaurou';

    protected $fillable = [
        'user_id',
        'acao',
        'modulo',
        'auditavel_type',
        'auditavel_id',
        'descricao',
        'alteracoes',
        'ip',
    ];

    protected $casts = [
        'alteracoes' => 'array',
        'created_at' => 'datetime',
    ];

    /**
     * Quem fez a ação. NULL = o próprio sistema (job/comando agendado) ou um
     * usuário que já foi excluído.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
