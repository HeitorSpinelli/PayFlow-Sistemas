<?php

namespace App\Services\Notificacao;

use App\Models\Notificacoes;
use App\Models\Segurado;
use Illuminate\Support\Facades\Mail;
use App\Models\TipoNotificacao;
use App\Mail\NotificacaoMail;

class NotificacaoService
{
    public function criarEEnviar(array $data): void
    {
        foreach ($data['segurado_ids'] as $seguradoId) {
            $segurado = Segurado::findOrFail($seguradoId);

            $notificacao = Notificacoes::create([
                'segurado_id'      => $seguradoId,
                'user_id'          => auth()->id(),
                'canal'            => $data['canal'],
                'mensagem'         => $data['mensagem'],
                'tipo_notificacao_id' => $data['tipo_notificacao_id'],
                'status'           => 'Pendente',
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
                $notificacao->update(['status' => 'Falha']);
            }
        }
    }
}
