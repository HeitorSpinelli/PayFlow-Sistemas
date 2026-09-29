<?php

namespace App\Services\Assistente;

use Illuminate\Http\Client\RequestException;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class DininhoService
{
    /**
     * Quantas mensagens anteriores do histórico entram no contexto enviado
     * à API. Limita o tamanho do payload (e o custo por chamada) sem
     * cortar totalmente a memória da conversa.
     */
    private const MAX_HISTORICO = 12;

    private const MENSAGEM_INDISPONIVEL = 'O assistente Dininho está temporariamente indisponível. Por favor, tente novamente em instantes.';

    private const MENSAGEM_ERRO_GENERICO = 'Desculpe, ocorreu um erro ao processar sua pergunta. Por favor, tente novamente.';

    private const MENSAGEM_LIMITE_EXCEDIDO = 'Estou recebendo muitas perguntas agora. Aguarde um instante e tente novamente.';

    private const MENSAGEM_SOBRECARREGADO = 'O serviço de IA está sobrecarregado no momento. Aguarde alguns instantes e tente novamente.';

    private const SYSTEM_PROMPT = 'Você é o Dininho, assistente virtual do PayFlow-Sistemas, um sistema de gestão para corretoras de seguro. '
        .'Responda de forma curta, clara e educada, em português do Brasil, usando o histórico da conversa como contexto quando fizer sentido. '
        .'Responda apenas sobre o funcionamento do sistema PayFlow (clientes, apólices, pagamentos, financeiro/inadimplência, dashboard, notificações, administração). '
        .'Você não tem acesso aos dados reais cadastrados no sistema (não sabe nomes de clientes, valores ou apólices específicas) — nesses casos, oriente o usuário a consultar a tela correspondente. '
        .'Se a pergunta não tiver relação com o sistema, recuse educadamente.';

    /**
     * Envia a pergunta do usuário para o modelo Gemini, junto com o
     * histórico recente da conversa para manter o contexto entre mensagens.
     *
     * @param  array<int, array{autor: string, texto: string}>  $historico
     */
    public function perguntar(string $mensagem, array $historico = []): string
    {
        $chave = config('services.gemini.key');

        if (blank($chave)) {
            Log::warning('Dininho: tentativa de uso sem GEMINI_API_KEY configurada.');

            return self::MENSAGEM_INDISPONIVEL;
        }

        $modelo = config('services.gemini.model', 'gemini-3.8-flash');

        try {
            $response = Http::timeout(20)
                // Pico de demanda do lado do Gemini (HTTP 503) costuma durar
                // só alguns segundos — vale uma tentativa extra antes de
                // desistir e mostrar o erro pro usuário.
                ->retry(2, 700, function (\Throwable $exception) {
                    return $exception instanceof RequestException
                        && $exception->response->status() === 503;
                })
                ->withHeaders([
                    // x-goog-api-key é a chave de API do Google AI Studio para acessar o modelo Gemini.
                    'x-goog-api-key' => $chave,
                    'Content-Type' => 'application/json',
                ])
                ->post("https://generativelanguage.googleapis.com/v1beta/models/{$modelo}:generateContent", [
                    'contents' => [
                        ...$this->formatarHistorico($historico),
                        ['role' => 'user', 'parts' => [['text' => $mensagem]]],
                    ],
                    'system_instruction' => [
                        'parts' => [['text' => self::SYSTEM_PROMPT]],
                    ],
                    'generationConfig' => [
                        'temperature' => 0.4,
                        'maxOutputTokens' => 800,
                    ],
                ])
                ->throw();

            $texto = $response->json('candidates.0.content.parts.0.text');

            return is_string($texto) && $texto !== ''
                ? trim($texto)
                : 'Desculpe, não consegui processar sua pergunta. Por favor, tente novamente.';
        } catch (RequestException $e) {
            $status = $e->response?->status();

            Log::warning('Erro ao processar pergunta do Dininho (HTTP '.$status.'): '.$e->getMessage());

            return match (true) {
                $status === 429 => self::MENSAGEM_LIMITE_EXCEDIDO,
                // 503 é o que o Gemini devolve quando o modelo está com pico de
                // demanda do lado deles — não é bug nosso, então merece uma
                // mensagem que deixe isso claro em vez do genérico "erro".
                in_array($status, [500, 502, 503, 504], true) => self::MENSAGEM_SOBRECARREGADO,
                default => self::MENSAGEM_ERRO_GENERICO,
            };
        } catch (\Throwable $e) {
            Log::warning('Erro ao processar pergunta do Dininho: '.$e->getMessage());

            return self::MENSAGEM_ERRO_GENERICO;
        }
    }

    /**
     * Converte o histórico vindo do front (autor "usuario"/"dininho") para
     * o formato de "contents" da API do Gemini (role "user"/"model"),
     * mantendo só as últimas mensagens para limitar o payload.
     *
     * @param  array<int, array{autor: string, texto: string}>  $historico
     * @return array<int, array{role: string, parts: array<int, array{text: string}>}>
     */
    private function formatarHistorico(array $historico): array
    {
        return collect($historico)
            ->filter(fn ($item) => is_array($item) && ! blank($item['texto'] ?? null))
            ->take(-self::MAX_HISTORICO)
            ->map(fn ($item) => [
                'role' => ($item['autor'] ?? null) === 'usuario' ? 'user' : 'model',
                'parts' => [['text' => (string) $item['texto']]],
            ])
            ->values()
            ->all();
    }
}
