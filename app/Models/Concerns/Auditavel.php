<?php

namespace App\Models\Concerns;

use App\Models\Auditoria;
use App\Services\Auditoria\AuditoriaService;

/**
 * Liga um model ao log de auditoria: todo create, update, delete e restore
 * feito pelo Eloquent vira uma linha na tela Auditoria, sem o controller ou o
 * service precisar lembrar de registrar.
 *
 * Limite: alterações em massa pelo query builder (Model::where(...)->update())
 * não disparam eventos do Eloquent e por isso não entram no log.
 *
 * O model pode sobrescrever auditoriaModulo(), auditoriaDescricao() e
 * auditoriaCamposIgnorados() para controlar como aparece na tela.
 */
trait Auditavel
{
    public static function bootAuditavel(): void
    {
        static::created(fn ($model) => app(AuditoriaService::class)->registrar($model, Auditoria::ACAO_CRIOU));
        static::updated(fn ($model) => app(AuditoriaService::class)->registrar($model, Auditoria::ACAO_EDITOU));
        static::deleted(fn ($model) => app(AuditoriaService::class)->registrar($model, $model->auditoriaAcaoExclusao()));

        // restored() só existe em models com SoftDeletes.
        if (method_exists(static::class, 'restored')) {
            static::restored(fn ($model) => app(AuditoriaService::class)->registrar($model, Auditoria::ACAO_RESTAUROU));
        }
    }

    /**
     * Nome do módulo na coluna "Módulo" e no filtro da tela Auditoria.
     */
    public function auditoriaModulo(): string
    {
        return class_basename($this);
    }

    /**
     * Rótulo do registro na coluna "Registro" (ex.: nome do cliente).
     */
    public function auditoriaDescricao(): string
    {
        return $this->auditoriaModulo().' #'.$this->getKey();
    }

    /**
     * Ação gravada quando o registro é excluído. Pagamento sobrescreve para
     * 'estornou', que é o que a exclusão significa lá.
     */
    public function auditoriaAcaoExclusao(): string
    {
        return Auditoria::ACAO_EXCLUIU;
    }

    /**
     * Campos que não aparecem no detalhe das alterações. Se uma edição só
     * mexer em campos ignorados, ela nem é registrada.
     */
    public function auditoriaCamposIgnorados(): array
    {
        return [];
    }
}
