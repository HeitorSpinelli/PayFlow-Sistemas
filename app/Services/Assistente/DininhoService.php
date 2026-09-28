<?php

namespace App\Services\Assistente;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class DininhoService
{
    public function perguntar(string $mensagem)
    {
        $chave = config('services.gemini.key');

        $systemPrompt = 'Você é o Dininho, assistente virtual do PayFlow-Sistemas, um sistema de gestão para corretoras de seguro. Responda de forma curta, clara e educada, em português do Brasil. Responda apenas sobre o funcionamento do sistema PayFlow (clientes, apólices, pagamentos, financeiro/inadimplência, dashboard, notificações, administração). Se a pergunta não tiver relação com o sistema, recuse educadamente.';

        try {
            $response = Http::withHeaders([
                'x-goog-api-key' => $chave,
                'Content-Type' => 'application/json',
            ])->post('https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent', [
                'contents' => [
                    ['parts' => [['text' => $mensagem]]],
                ],
                'system_instruction' => [
                    'parts' => [['text' => $systemPrompt]],
                ],
            ])->throw();

            return $response->json()['candidates'][0]['content']['parts'][0]['text']
                ?? 'Desculpe, não consegui processar sua pergunta. Por favor, tente novamente.';
        } catch (\Throwable $e) {
            Log::warning('Erro ao processar pergunta do Dininho: ' . $e->getMessage());
            return 'Desculpe, ocorreu um erro ao processar sua pergunta. Por favor, tente novamente.';
        }
    }
}