<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Vite;
use Symfony\Component\HttpFoundation\Response;

/**
 * Adiciona cabeçalhos de segurança a todas as respostas. Sem efeito visual.
 */
class SecurityHeaders
{
    /**
     * Adiciona os cabeçalhos de segurança que o Laravel não define por
     * padrão: proteção contra clickjacking, MIME-sniffing, vazamento de URL
     * via Referer, acesso a câmera/microfone/localização e a Content
     * Security Policy (CSP).
     *
     * A CSP é a principal barreira contra XSS: mesmo que algum texto
     * malicioso chegue a ser injetado na página, o navegador só executa
     * script do próprio domínio ou com o nonce sorteado nesta requisição
     * (o @vite e os <script> das views recebem o nonce automaticamente via
     * Vite::cspNonce()). Fica desligada com o `npm run dev` rodando: o
     * servidor do Vite injeta scripts de outra origem (porta 5173) e
     * websocket de hot reload.
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Sorteia o nonce ANTES de a view ser montada (dentro do $next).
        $comCsp = ! Vite::isRunningHot();
        if ($comCsp) {
            Vite::useCspNonce();
        }

        $response = $next($request);

        $response->headers->set('X-Frame-Options', 'DENY');
        $response->headers->set('X-Content-Type-Options', 'nosniff');
        $response->headers->set('Referrer-Policy', 'strict-origin-when-cross-origin');
        $response->headers->set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=(), usb=()');
        $response->headers->set('Cross-Origin-Opener-Policy', 'same-origin');
        $response->headers->remove('X-Powered-By');
        header_remove('X-Powered-By');

        if ($comCsp) {
            $response->headers->set('Content-Security-Policy', $this->politica(Vite::cspNonce()));
        }

        if ($request->isSecure()) {
            $response->headers->set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
        }

        return $response;
    }

    /**
     * Origens liberadas: tudo do próprio domínio; fontes do fonts.bunny.net
     * (app.blade.php); imagens data:/blob: (prévia da foto de perfil antes do
     * envio); e as duas APIs que o navegador chama direto nos formulários de
     * cliente (create-segurado-modal e painel-cliente): IBGE (lista de
     * estados) e ViaCEP (endereço pelo CEP). Uma API nova chamada pelo front
     * precisa entrar em connect-src, senão o navegador bloqueia.
     *
     * 'unsafe-inline' só em estilos — o React e o Radix usam style="" o tempo
     * todo, e estilo sozinho não executa código.
     */
    private function politica(string $nonce): string
    {
        return implode('; ', [
            "default-src 'self'",
            "script-src 'self' 'nonce-{$nonce}'",
            "style-src 'self' 'unsafe-inline' https://fonts.bunny.net",
            "font-src 'self' https://fonts.bunny.net data:",
            "img-src 'self' data: blob:",
            "connect-src 'self' https://servicodados.ibge.gov.br https://viacep.com.br",
            "object-src 'none'",
            "base-uri 'self'",
            "form-action 'self'",
            "frame-ancestors 'none'",
        ]);
    }
}
