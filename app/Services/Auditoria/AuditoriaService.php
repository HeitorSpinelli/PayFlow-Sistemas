<?php

namespace App\Services\Auditoria;

use App\Models\Auditoria;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Schema;

/**
 * Grava o log de auditoria (chamado pelo trait Auditavel) e monta os dados da
 * tela Auditoria.
 */
class AuditoriaService
{
    /**
     * Campos que nunca entram no detalhe de alterações, em nenhum model:
     * carimbos de data automáticos e dados internos de login/2FA, que mudam
     * sozinhos (ex.: remember_token a cada login) e só gerariam ruído.
     */
    private const CAMPOS_IGNORADOS = [
        'created_at',
        'updated_at',
        'deleted_at',
        'remember_token',
        'two_factor_secret',
        'two_factor_recovery_codes',
        'two_factor_confirmed_at',
        'email_verified_at',
    ];

    /**
     * Campos cujo valor nunca é gravado no log: aparece só que foram alterados.
     */
    private const CAMPOS_SIGILOSOS = ['password'];

    /**
     * Cache de tabelaExiste() (static: o service é resolvido de novo pelo
     * app() a cada evento).
     */
    private static bool $tabelaExiste = false;

    /**
     * Registra uma ação sobre $model. Em edições, guarda o "de → para" de cada
     * campo alterado; se nada relevante mudou, não grava nada.
     */
    public function registrar(Model $model, string $acao): void
    {
        if (! $this->tabelaExiste()) {
            return;
        }

        $ignorados = array_merge(self::CAMPOS_IGNORADOS, $model->auditoriaCamposIgnorados());
        $alteracoes = null;

        if ($acao === Auditoria::ACAO_EDITOU) {
            $alteracoes = $this->diferencas($model, $ignorados);

            if ($alteracoes === []) {
                return;
            }
        }

        if ($acao === Auditoria::ACAO_CRIOU) {
            $alteracoes = $this->valoresIniciais($model, $ignorados);
        }

        Auditoria::create([
            'user_id' => auth()->id(),
            'acao' => $acao,
            'modulo' => $model->auditoriaModulo(),
            'auditavel_type' => $model->getMorphClass(),
            'auditavel_id' => $model->getKey(),
            'descricao' => mb_substr($model->auditoriaDescricao(), 0, 255),
            'alteracoes' => $alteracoes ?: null,
            // Jobs e comandos agendados não têm requisição HTTP.
            'ip' => app()->runningInConsole() ? null : request()->ip(),
        ]);
    }

    /**
     * Trava de segurança para quem atualizou o código mas ainda não rodou
     * `php artisan migrate`: sem a tabela, o insert do log falharia dentro da
     * mesma transação e derrubaria TODO cadastro/edição/pagamento do sistema.
     * Assim o sistema segue funcionando, só sem registrar o log até a migration.
     *
     * Consultado uma vez por requisição/processo; a resposta positiva é
     * guardada, a negativa não (para o log começar assim que a migration rodar,
     * mesmo em workers de fila que ficam no ar).
     */
    private function tabelaExiste(): bool
    {
        if (self::$tabelaExiste) {
            return true;
        }

        return self::$tabelaExiste = Schema::hasTable('auditorias');
    }

    /**
     * Campo => [de, para] de uma edição. Usa os valores crus do banco (sem
     * casts) para datas e números aparecerem iguais ao que está gravado.
     */
    private function diferencas(Model $model, array $ignorados): array
    {
        $alteracoes = [];

        foreach (array_keys($model->getChanges()) as $campo) {
            if (in_array($campo, $ignorados, true)) {
                continue;
            }

            $alteracoes[$campo] = in_array($campo, self::CAMPOS_SIGILOSOS, true)
                ? ['de' => '••••••', 'para' => '(alterada)']
                : ['de' => $model->getRawOriginal($campo), 'para' => $model->getAttributes()[$campo] ?? null];
        }

        return $alteracoes;
    }

    /**
     * Campo => [de: null, para] dos valores preenchidos na criação.
     */
    private function valoresIniciais(Model $model, array $ignorados): array
    {
        $alteracoes = [];

        foreach ($model->getAttributes() as $campo => $valor) {
            if ($valor === null || $valor === '' || $campo === $model->getKeyName() || in_array($campo, $ignorados, true)) {
                continue;
            }

            $alteracoes[$campo] = in_array($campo, self::CAMPOS_SIGILOSOS, true)
                ? ['de' => null, 'para' => '(definida)']
                : ['de' => null, 'para' => $valor];
        }

        return $alteracoes;
    }
}
