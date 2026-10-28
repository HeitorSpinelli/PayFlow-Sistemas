<?php

namespace App\Services\Notificacao;

use App\Mail\NotificacaoMail;
use App\Models\Apolice;
use App\Models\Notificacoes;
use App\Models\Segurado;
use App\Models\TipoNotificacao;
use App\Services\Financeiro\ParcelaFinanceiroService;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class NotificacaoService
{
    protected ParcelaFinanceiroService $parcelaFinanceiro;

    public function __construct(ParcelaFinanceiroService $parcelaFinanceiro)
    {
        $this->parcelaFinanceiro = $parcelaFinanceiro;
    }

    public function criarEEnviar(array $data): void
    {
        foreach ($data['segurado_ids'] as $seguradoId) {
            $segurado = Segurado::findOrFail($seguradoId);

            $notificacao = Notificacoes::create([
                'segurado_id' => $seguradoId,
                'user_id' => auth()->id(),
                'canal' => $data['canal'],
                'mensagem' => $data['mensagem'],
                'tipo_notificacao_id' => $data['tipo_notificacao_id'],
                'status' => 'Pendente',
            ]);
            try {
                $tipoNotificacao = TipoNotificacao::findOrFail($data['tipo_notificacao_id']);

                // WhatsApp não tem integração de API configurada (o
                // whatsapp_token de configuracoes_sistema nunca chegou a ser
                // usado em lugar nenhum) — o envio de verdade é manual: o
                // operador abre o link wa.me (montado no frontend, já com a
                // mensagem pronta a partir dos dados da parcela) e aperta
                // enviar pelo próprio WhatsApp dele. Só o e-mail é disparado
                // de fato por aqui; para whatsapp este registro guarda
                // apenas o histórico da mensagem gerada.
                if ($data['canal'] !== 'whatsapp') {
                    Mail::to($segurado->email)->send(new NotificacaoMail(
                        assunto: $tipoNotificacao->nome_notificacao,
                        mensagem: $data['mensagem'],
                        nomeSegurado: $segurado->nome_completo,
                    ));
                }

                $notificacao->update([
                    'status' => 'Enviado',
                    'data_envio' => now(),
                ]);
            } catch (\Exception $e) {
                Log::error('Falha ao enviar notificação para segurado #'.$seguradoId.': '.$e->getMessage());
                // Antes só o log guardava o motivo — quem via a tela via
                // "Falha" sem nenhuma pista de por quê (achado em teste
                // exploratório). Guardar aqui também deixa o motivo visível
                // sem precisar acessar o servidor.
                $notificacao->update(['status' => 'Falha', 'erro' => $e->getMessage()]);
            }
        }
    }

    /**
     * Todos os segurados para a tela de Notificações, cada um já com a
     * parcela em aberto mais relevante embutida (resumoParcelaCobranca()) —
     * é o que permite montar no frontend uma mensagem de WhatsApp/e-mail
     * com dados reais (apólice, valor, vencimento, atraso) em vez de texto
     * solto. `devedor` também sai de um dado real (parcela atrasada de
     * verdade), e não de um campo que nunca existiu no model.
     */
    public function seguradosParaNotificar()
    {
        return Segurado::with('apolices.parcelas')
            ->get()
            ->each(function (Segurado $segurado) {
                $parcela = $this->resumoParcelaCobranca($segurado);

                $segurado->parcela_cobranca = $parcela;
                $segurado->devedor = $parcela !== null && $parcela['situacao'] === 'atrasada';
            });
    }

    /**
     * Parcela em aberto mais relevante do segurado para montar uma
     * cobrança: prioriza a mais antiga ATRASADA (a que já devia ter sido
     * paga há mais tempo — maior urgência); sem nenhuma atrasada, cai para
     * a próxima a vencer. Sem nenhuma parcela em aberto, não há o que
     * cobrar. Mesma convenção de sinal de dias usada em
     * ApoliceService::vencimentosProximos() (negativo = já venceu).
     *
     * Espera 'apolices.parcelas' já carregado (ver seguradosParaNotificar())
     * para não rodar uma query por cliente.
     */
    private function resumoParcelaCobranca(Segurado $segurado): ?array
    {
        $pendentes = $segurado->apolices->flatMap(
            fn (Apolice $apolice) => $apolice->parcelas
                ->filter(fn ($parcela) => $parcela->status_pagamento !== 'paga')
                ->map(fn ($parcela) => ['apolice' => $apolice, 'parcela' => $parcela])
        );

        if ($pendentes->isEmpty()) {
            return null;
        }

        $hoje = Carbon::today();

        $atrasadas = $pendentes
            ->filter(fn (array $item) => Carbon::parse($item['parcela']->data_vencimento)->startOfDay()->lt($hoje))
            ->sortBy(fn (array $item) => $item['parcela']->data_vencimento);

        $escolhido = $atrasadas->first()
            ?? $pendentes->sortBy(fn (array $item) => $item['parcela']->data_vencimento)->first();

        $apolice = $escolhido['apolice'];
        $parcela = $escolhido['parcela'];

        $vencimento = Carbon::parse($parcela->data_vencimento)->startOfDay();
        $dias = $hoje->diffInDays($vencimento, false);
        $calculo = $this->parcelaFinanceiro->calcular($parcela);

        return [
            'apolice_numero' => $apolice->numero_apolice,
            'numero_parcela' => $parcela->numero_parcela,
            'quantidade_parcelas' => $apolice->quantidade_parcelas,
            'valor_parcela' => (float) $parcela->valor_parcela,
            'valor_atualizado' => $calculo['valor_total'],
            'data_vencimento' => $parcela->data_vencimento,
            'situacao' => $dias < 0 ? 'atrasada' : 'a_vencer',
            'dias' => (int) abs($dias),
        ];
    }

    // Últimas notificações disparadas (manual ou por automação) — usado no
    // card "Notificações" do dashboard.
    public function recentes(int $limite = 6)
    {
        return Notificacoes::with('segurado')
            ->latest()
            ->limit($limite)
            ->get()
            ->map(function ($notificacao) {
                return [
                    'id' => $notificacao->id,
                    'texto' => $this->textoResumo($notificacao),
                    'data' => $notificacao->created_at,
                    'status' => match ($notificacao->status) {
                        'Enviado' => 'enviado',
                        'Falha' => 'falha',
                        default => 'pendente',
                    },
                ];
            });
    }

    private function textoResumo(Notificacoes $notificacao): string
    {
        $nome = $notificacao->segurado->nome_completo ?? 'Cliente removido';

        return match ($notificacao->status) {
            'Falha' => "Falha ao notificar {$nome}",
            'Pendente' => "Notificação pendente — {$nome}",
            default => "Notificação enviada para {$nome}",
        };
    }
}
