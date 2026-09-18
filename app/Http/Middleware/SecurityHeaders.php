<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SecurityHeaders
{
    /**
     * Adiciona os cabeçalhos de segurança que o Laravel não define por
     * padrão: proteção contra clickjacking, MIME-sniffing e vazamento de
     * URL via Referer. Não inclui CSP porque o app carrega assets do Vite
     * com hashes/paths dinâmicos — endurecer isso exigiria mapear todas as
     * origens permitidas primeiro.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        $response->headers->set('X-Frame-Options', 'DENY');
        $response->headers->set('X-Content-Type-Options', 'nosniff');
        $response->headers->set('Referrer-Policy', 'strict-origin-when-cross-origin');

        if ($request->isSecure()) {
            $response->headers->set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
        }

        return $response;
    }
}
