<?php

namespace App\Services\Notificacao;

use App\Models\notificacoes;
use App\Models\Segurado;
use Illuminate\Support\Facades\Mail;
use App\Mail\NotificacaoMail;

class NotificacaoService
{
    public function criarEEnviar(array $data): void
    {
        foreach ($data['segurado_ids'] as $seguradoId) {
            $segurado = Segurado::findOrFail($seguradoId);

            $notificacao = notificacoes::create([
                'segurado_id'      => $seguradoId,
                'user_id'          => auth()->id(),
                'canal'            => $data['canal'],
                'assunto_email' => $data['tipo_notificacao'],
                'mensagem'         => $data['mensagem'],
                'tipo_notificacao' => $data['tipo_notificacao'],
                'status'           => 'Pendente',
            ]);
            try {
                Mail::to($segurado->email)->send(new NotificacaoMail(
                    assunto: $data['tipo_notificacao'],
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
