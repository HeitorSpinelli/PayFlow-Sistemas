<?php

namespace App\Console\Commands;

use App\Models\Apolice;
use App\Models\TipoNotificacao;
use App\Services\Apolice\ApoliceService;
use App\Services\Notificacao\NotificacaoService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class VerificarInadimplenciaParcelas extends Command
{
    protected $signature = 'apolices:verificar-inadimplencia';

    protected $description = 'Suspende apólices com parcela (2ª em diante) em atraso e cancela as que seguem suspensas há mais de 30 dias (Lei 15.040/2024, art. 21).';

    // Prazo mínimo de aviso prévio antes de poder cancelar por mora a partir
    // da 2ª parcela — diferente da 1ª parcela, que a lei permite cancelar na
    // hora (ver CancelarApolicesPorAtrasoDaPrimeiraParcela).
    private const DIAS_PARA_CANCELAMENTO = 30;

    public function handle(ApoliceService $apoliceService, NotificacaoService $notificacaoService): void
    {
        if (! config('automacoes.financeiras_ativas')) {
            $this->warn('Automações financeiras desativadas (AUTOMACOES_FINANCEIRAS_ATIVAS=false no .env). Nada foi executado.');

            return;
        }

        $this->suspenderApolicesInadimplentes($notificacaoService);
        $this->cancelarApolicesSuspensasHaMuitoTempo($apoliceService);
    }

    /**
     * Suspende apólices que têm parcela 2ª+ em atraso e ainda não estão
     * suspensas. whereNull('suspensa_em') garante que isso só acontece na
     * PRIMEIRA detecção — rodar o comando de novo no dia seguinte não fica
     * "empurrando" a data de suspensão pra frente.
     */
    private function suspenderApolicesInadimplentes(NotificacaoService $notificacaoService): void
    {
        $apolices = Apolice::whereNull('suspensa_em')
            ->whereHas('parcelas', function ($query) {
                $query->where('numero_parcela', '>=', 2)
                    ->where('status_pagamento', 'em_aberto')
                    ->where('data_vencimento', '<', now()->startOfDay());
            })
            ->get();

        if ($apolices->isEmpty()) {
            return;
        }

        // firstOrCreate: idempotente — só cria a linha em tipos_notificacao na
        // primeira vez que o comando roda; nas próximas, só reaproveita.
        $tipoNotificacao = TipoNotificacao::firstOrCreate(
            ['nome_notificacao' => 'Suspensão de Apólice por Atraso'],
            ['ativo' => true],
        );

        foreach ($apolices as $apolice) {
            $apolice->update(['suspensa_em' => now()]);
            $this->info("Apólice #{$apolice->numero_apolice} suspensa — parcela em atraso.");

            try {
                $notificacaoService->criarEEnviar([
                    'segurado_ids' => [$apolice->cliente_id],
                    'canal' => 'email',
                    'mensagem' => $this->montarMensagemSuspensao($apolice),
                    'tipo_notificacao_id' => $tipoNotificacao->id,
                ]);
            } catch (\Exception $e) {
                // Falha ao notificar NÃO deve desfazer a suspensão — a suspensão
                // em si é o que importa legalmente (é ela que inicia a contagem
                // dos 30 dias). Só registra o problema para investigação depois.
                //
                // Na prática, NotificacaoService::criarEEnviar() já engole os
                // erros de ENVIO DE E-MAIL internamente (marca a notificação
                // como "Falha" e loga por conta própria) — esse catch aqui cobre
                // os outros dois passos que ainda podem estourar antes disso:
                // Segurado::findOrFail() e Notificacoes::create().
                Log::warning("Falha ao notificar segurado sobre suspensão da apólice #{$apolice->numero_apolice}: ".$e->getMessage());
            }
        }
    }

    /**
     * Mensagem enviada ao segurado quando a apólice é suspensa. Inclui a
     * parcela mais antiga em atraso (se houver) para o segurado já saber
     * de cara o que precisa regularizar.
     */
    private function montarMensagemSuspensao(Apolice $apolice): string
    {
        $parcelaAtrasada = $apolice->parcelas()
            ->where('numero_parcela', '>=', 2)
            ->where('status_pagamento', 'em_aberto')
            ->where('data_vencimento', '<', now()->startOfDay())
            ->orderBy('numero_parcela')
            ->first();

        $detalheParcela = $parcelaAtrasada
            ? sprintf(
                ' A parcela nº %d, no valor de R$ %s, está em atraso.',
                $parcelaAtrasada->numero_parcela,
                number_format((float) $parcelaAtrasada->valor_parcela, 2, ',', '.'),
            )
            : '';

        return "A garantia da sua apólice nº {$apolice->numero_apolice} foi suspensa por atraso no pagamento de parcela.{$detalheParcela} "
            .'Você tem 30 dias, a partir de hoje, para regularizar o pagamento — caso contrário, a apólice será cancelada automaticamente, conforme previsto na Lei 15.040/2024, art. 21.';
    }

    /**
     * Cancela apólices que já estão suspensas há 30+ dias sem regularização.
     * Reaproveita ApoliceService::destroy() — mesma cascata (parcelas +
     * pagamentos) já usada no cancelamento por atraso da 1ª parcela.
     */
    private function cancelarApolicesSuspensasHaMuitoTempo(ApoliceService $apoliceService): void
    {
        $limite = now()->subDays(self::DIAS_PARA_CANCELAMENTO);

        $apolices = Apolice::whereNotNull('suspensa_em')
            ->where('suspensa_em', '<=', $limite)
            ->get();

        foreach ($apolices as $apolice) {
            try {
                $apoliceService->destroy($apolice->id, Apolice::MOTIVO_CANCELAMENTO_SUSPENSAO_PROLONGADA);
                $this->info("Apólice #{$apolice->numero_apolice} cancelada — suspensa há mais de ".self::DIAS_PARA_CANCELAMENTO.' dias.');
            } catch (\Exception $e) {
                $this->error("Falha ao cancelar apólice #{$apolice->id}: ".$e->getMessage());
            }
        }
    }
}
