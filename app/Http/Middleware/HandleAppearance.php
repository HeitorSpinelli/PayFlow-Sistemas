<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\View;
use Symfony\Component\HttpFoundation\Response;

/**
 * Compartilha com a view raiz (app.blade.php) o tema escolhido (claro/escuro/
 * sistema), lido do cookie — é o que evita o "piscar" de tema ao carregar.
 */
class HandleAppearance
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // O cookie não é criptografado (o front grava direto) e o valor vai
        // para dentro de um <script> no app.blade.php: só aceita os 3 valores
        // conhecidos, para nada vindo do cookie virar código na página.
        $tema = $request->cookie('appearance');

        View::share('appearance', in_array($tema, ['light', 'dark', 'system'], true) ? $tema : 'system');

        return $next($request);
    }
}
