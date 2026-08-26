<?php

namespace App\Jobs;

use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use App\Models\Automacao;
use App\Models\Segurado;
use App\Models\Apolice;
use App\Models\Parcelas;
use App\Services\Notificacao\NotificacaoService;
use Dom\Notation;

class ProcessarAutomacoes implements ShouldQueue
{
    use Queueable;

    /**
     * Create a new job instance.
     */
    public function __construct()
    {
        //
    }

    /**
     * Executa a automação.
     */
    public function handle(): void
    {
        $service = new NotificacaoService();
        $automacoes = Automacao::with(['notificacoes'])->where('ativo', true)->get();

        foreach ($automacoes as $automacao) {
            // Pula automações cujo tipo de notificação foi desativado
            if (!$automacao->notificacoes || !$automacao->notificacoes->ativo) {
                continue;
            }

            match ($automacao->tipo_condicao) {
                'apolice_vencendo'   => $this->processarApoliceVencendo($automacao, $service),
                'parcela_vencendo'   => $this->processarParcelaVencendo($automacao, $service),
                'parcela_em_atraso'  => $this->processarParcelaEmAtraso($automacao, $service),
                'cliente_inativo'    => $this->processarClienteInativo($automacao, $service),
                default              => null,
            };
        }
    }
    private function processarClienteInativo(Automacao $automacao, NotificacaoService $service): void
    {
        $dataLimite = now()->subDays($automacao->dias);

        $segurados = Segurado::where('status', 'Inativo')
            ->where('updated_at', '<=', $dataLimite)
            ->get();

        foreach ($segurados as $segurado) {
            $service->criarEEnviar([
                'segurado_ids'        => [$segurado->id],
                'canal'               => $automacao->canal,
                'mensagem'            => $automacao->mensagem,
                'tipo_notificacao_id' => $automacao->tipo_notificacao_id,
            ]);
        }
    }

    private function processarParcelaEmAtraso(Automacao $automacao, NotificacaoService $service): void
    {
        // 'dias' define a tolerância: só notifica parcelas vencidas há MAIS de X dias.
        // Ex: se dias = 3, só notifica quem está em atraso há mais de 3 dias,
        // evitando notificar no mesmo dia do vencimento.
        $dataLimite = now()->subDays($automacao->dias);

        // Busca parcelas com status 'vencida' E cuja data de vencimento
        // já passou há mais de X dias (dataLimite).
        // O with('apolice.cliente') carrega o relacionamento encadeado:
        // parcela → apólice → cliente (segurado), tudo em uma única query
        // pra evitar o problema de N+1 queries (buscar um por um seria muito lento).
        $parcelas = parcelas::with('apolice.cliente')
            ->where('status_pagamento', 'vencida')
            ->where('data_vencimento', '<=', $dataLimite) // aqui deveria ser $dataLimite, não now()
            ->get();

        // Percorre cada parcela encontrada e dispara uma notificação
        // pro segurado dono da apólice vinculada a essa parcela.
        foreach ($parcelas as $parcela) {
            // Navega o relacionamento: parcela → apolice → cliente (segurado)
            $segurado = $parcela->apolice->cliente;

            // Proteção: se a apólice foi deletada ou o cliente não existe,
            // pula essa parcela sem quebrar o loop inteiro.
            if (!$segurado) continue;

            // Usa o serviço já existente pra criar o registro no banco
            // E disparar o email/whatsapp pro segurado.
            $service->criarEEnviar([
                'segurado_ids'        => [$segurado->id],
                'canal'               => $automacao->canal,
                'mensagem'            => $automacao->mensagem,
                'tipo_notificacao_id' => $automacao->tipo_notificacao_id,
            ]);
        }
    }

    private function processarParcelaVencendo(Automacao $automacao, NotificacaoService $service): void
    {
        //define parcelas com status de pagamento vencidas ou data de vencimento menor igual a atual
        $parcelas = parcelas::with('apolice.cliente')->whereBetween('data_vencimento', [now(), now()->addDays($automacao->dias)])->get();

        //Para cada parcela dentro de apolice do cliente dono da mesma usar o service de disparo de email
        foreach ($parcelas as $parcela) {
            $segurado = $parcela->apolice->cliente;

            if (!$segurado) continue;

            $service->criarEEnviar([
                'segurado_ids'        => [$segurado->id],
                'canal'               => $automacao->canal,
                'mensagem'            => $automacao->mensagem,
                'tipo_notificacao_id' => $automacao->tipo_notificacao_id,
            ]);
        }
    }
    private function processarApoliceVencendo(Automacao $automacao, NotificacaoService $service): void
    {
        //define parcelas com status de pagamento vencidas ou data de vencimento menor igual a atual
        $apolices = Apolice::with('cliente')->whereBetween('fim_vigencia', [now(), now()->addDays($automacao->dias)])->get();

        //Para cada parcela dentro de apolice do cliente dono da mesma usar o service de disparo de email
        foreach ($apolices as $apolice) {
            $segurado = $apolice->cliente;

            if (!$segurado) continue;

            $service->criarEEnviar([
                'segurado_ids'        => [$segurado->id],
                'canal'               => $automacao->canal,
                'mensagem'            => $automacao->mensagem,
                'tipo_notificacao_id' => $automacao->tipo_notificacao_id,
            ]);
        }
    }
}
