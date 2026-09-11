<?php

namespace App\Jobs;

use App\Models\Apolice;
use App\Models\Automacao;
use App\Models\Notificacoes;
use App\Models\Parcelas;
use App\Models\Segurado;
use App\Services\Notificacao\NotificacaoService;
use Carbon\Carbon;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class ProcessarAutomacoes implements ShouldQueue
{
    use Queueable;

    public function handle(): void
    {
        $service = new NotificacaoService;
        $automacoes = Automacao::with(['tipoNotificacao'])->where('ativo', true)->get();

        foreach ($automacoes as $automacao) {
            // Pula automações cujo tipo de notificação foi desativado
            if (! $automacao->tipoNotificacao || ! $automacao->tipoNotificacao->ativo) {
                continue;
            }

            match ($automacao->tipo_condicao) {
                'apolice_vencendo' => $this->processarApoliceVencendo($automacao, $service),
                'parcela_vencendo' => $this->processarParcelaVencendo($automacao, $service),
                'parcela_em_atraso' => $this->processarParcelaEmAtraso($automacao, $service),
                'cliente_inativo' => $this->processarClienteInativo($automacao, $service),
                default => null,
            };
        }
    }

    /**
     * Decide se HOJE é um dia de disparo dado quantos dias faltam/já se
     * passaram desde o limiar configurado (ex: dias antes de vencer, ou dias
     * de atraso). Sem intervalo_dias: dispara uma única vez, exatamente
     * quando offset == 0 (comportamento original, preservado). Com
     * intervalo_dias: repete a cada N dias a partir dali, sempre que offset
     * >= 0 — é isso que permite o "avisa de 5 em 5 dias" pedido.
     */
    private function ehDiaDeDisparo(Automacao $automacao, int $offset): bool
    {
        if ($offset < 0) {
            return false;
        }

        if ($automacao->intervalo_dias === null) {
            return $offset === 0;
        }

        return $offset % $automacao->intervalo_dias === 0;
    }

    /**
     * Evita reenviar a mesma notificação mais de uma vez no mesmo dia pro
     * mesmo segurado — só importa se o job rodar mais de uma vez num dia
     * (ex: teste manual), já que ehDiaDeDisparo() já limita a 1x/dia por si só.
     */
    private function jaNotificadoHoje(int $seguradoId, int $tipoNotificacaoId): bool
    {
        return Notificacoes::where('segurado_id', $seguradoId)
            ->where('tipo_notificacao_id', $tipoNotificacaoId)
            ->whereDate('created_at', now())
            ->exists();
    }

    private function notificar(Automacao $automacao, NotificacaoService $service, Segurado $segurado): void
    {
        if ($this->jaNotificadoHoje($segurado->id, $automacao->tipo_notificacao_id)) {
            return;
        }

        $service->criarEEnviar([
            'segurado_ids' => [$segurado->id],
            'canal' => $automacao->canal,
            'mensagem' => $automacao->mensagem,
            'tipo_notificacao_id' => $automacao->tipo_notificacao_id,
        ]);
    }

    /**
     * "dias" = janela de antecedência (ex: 10 = avisa a partir de 10 dias
     * antes de vencer). Antes buscava tudo num whereBetween e reenviava a
     * MESMA apólice todo santo dia até vencer — trocado por checar dia a dia
     * quantos faltam e só disparar nos dias certos (ver ehDiaDeDisparo()).
     */
    private function processarApoliceVencendo(Automacao $automacao, NotificacaoService $service): void
    {
        $apolices = Apolice::with('cliente')
            ->whereBetween('fim_vigencia', [now()->startOfDay(), now()->addDays($automacao->dias)->endOfDay()])
            ->get();

        foreach ($apolices as $apolice) {
            $segurado = $apolice->cliente;

            if (! $segurado) {
                continue;
            }

            $diasParaVencer = now()->startOfDay()->diffInDays($apolice->fim_vigencia, false);

            if ($this->ehDiaDeDisparo($automacao, (int) $diasParaVencer)) {
                $this->notificar($automacao, $service, $segurado);
            }
        }
    }

    /**
     * "dias" = quantos dias antes do vencimento avisar. Mesma correção do
     * método acima: antes usava whereDate == data exata (só uma chance de
     * acertar o dia certo, e nunca repetia); agora usa uma janela e decide
     * dia a dia, então intervalo_dias passa a funcionar aqui também.
     */
    private function processarParcelaVencendo(Automacao $automacao, NotificacaoService $service): void
    {
        $parcelas = Parcelas::with('apolice.cliente')
            ->where('status_pagamento', '!=', 'paga')
            ->whereBetween('data_vencimento', [now()->startOfDay(), now()->addDays($automacao->dias)->endOfDay()])
            ->get();

        foreach ($parcelas as $parcela) {
            $segurado = $parcela->apolice?->cliente;

            if (! $segurado) {
                continue;
            }

            $diasParaVencer = now()->startOfDay()->diffInDays(Carbon::parse($parcela->data_vencimento), false);

            if ($this->ehDiaDeDisparo($automacao, (int) $diasParaVencer)) {
                $this->notificar($automacao, $service, $segurado);
            }
        }
    }

    /**
     * "dias" = tolerância mínima de atraso antes do primeiro aviso. Antes
     * buscava tudo que já passou de "dias" e reenviava todo santo dia pra
     * sempre; agora só dispara exatamente no dia em que o atraso bate "dias"
     * (sem intervalo) ou a cada intervalo_dias depois disso.
     */
    private function processarParcelaEmAtraso(Automacao $automacao, NotificacaoService $service): void
    {
        $parcelas = Parcelas::with('apolice.cliente')
            ->where('status_pagamento', '!=', 'paga')
            ->where('data_vencimento', '<', now()->startOfDay())
            ->get();

        foreach ($parcelas as $parcela) {
            $segurado = $parcela->apolice?->cliente;

            if (! $segurado) {
                continue;
            }

            $diasEmAtraso = Carbon::parse($parcela->data_vencimento)->diffInDays(now()->startOfDay());
            $offset = (int) $diasEmAtraso - $automacao->dias;

            if ($this->ehDiaDeDisparo($automacao, $offset)) {
                $this->notificar($automacao, $service, $segurado);
            }
        }
    }

    /**
     * "dias" = há quanto tempo o cliente está sem nenhuma apólice vigente.
     * A versão anterior filtrava por `status` — um accessor calculado em
     * PHP (Segurado::getStatusAttribute()), não uma coluna do banco — então
     * o `where('status', 'Inativo')` gerava erro de SQL (coluna inexistente)
     * toda vez que rodasse. Trocado pela condição real via whereDoesntHave.
     *
     * `updated_at` foi trocado pela data de fim de vigência da apólice mais
     * recente do cliente (diasSemApoliceVigente()): updated_at muda a
     * qualquer edição cadastral (telefone, endereço etc.) sem relação
     * nenhuma com apólices, então um cliente sem cobertura há anos podia
     * nunca disparar essa automação só por ter tido um dado corrigido.
     */
    private function processarClienteInativo(Automacao $automacao, NotificacaoService $service): void
    {
        $segurados = Segurado::whereDoesntHave('apolices', function ($query) {
            $query->ativas();
        })->get();

        foreach ($segurados as $segurado) {
            $offset = $this->diasSemApoliceVigente($segurado) - $automacao->dias;

            if ($this->ehDiaDeDisparo($automacao, $offset)) {
                $this->notificar($automacao, $service, $segurado);
            }
        }
    }

    /**
     * Há quantos dias o cliente está sem nenhuma apólice vigente, contados a
     * partir do fim de vigência da apólice mais recente dele (incluindo
     * canceladas/renovadas — o que importa é até quando ele teve cobertura,
     * não se a apólice em si ainda existe). Cliente que nunca teve nenhuma
     * apólice usa a data de cadastro como referência.
     */
    private function diasSemApoliceVigente(Segurado $segurado): int
    {
        $fimMaisRecente = $segurado->apolices()->withTrashed()->max('fim_vigencia');
        $referencia = $fimMaisRecente ? Carbon::parse($fimMaisRecente) : $segurado->created_at;

        return (int) $referencia->startOfDay()->diffInDays(now()->startOfDay());
    }
}
