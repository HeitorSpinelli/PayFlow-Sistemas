<?php

namespace App\Services\Notificacao;

use App\Mail\NotificacaoMail;
use App\Models\Notificacoes;
use App\Models\Segurado;
use App\Models\TipoNotificacao;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class NotificacaoService
{
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
                Mail::to($segurado->email)->send(new NotificacaoMail(
                    assunto: $tipoNotificacao->nome_notificacao,
                    mensagem: $data['mensagem'],
                    nomeSegurado: $segurado->nome_completo,
                ));
                $notificacao->update([
                    'status' => 'Enviado',
                    'data_envio' => now(),
                ]);
            } catch (\Exception $e) {
                Log::error('Falha ao enviar notificação para segurado #'.$seguradoId.': '.$e->getMessage());
                $notificacao->update(['status' => 'Falha']);
            }
        }
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
