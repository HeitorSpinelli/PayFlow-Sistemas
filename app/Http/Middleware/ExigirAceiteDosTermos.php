<?php

namespace App\Http\Middleware;

use App\Models\User;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Enquanto o usuário logado não aceitar a versão atual dos termos
 * (config/termos.php), nenhuma ação que grava dados passa — só a navegação
 * (GET), o próprio aceite e o logout. A janela de aceite é mostrada pelo
 * layout (ModalTermos); isto aqui garante a regra no servidor também.
 */
class ExigirAceiteDosTermos
{
    // Rotas liberadas mesmo sem o aceite.
    private const ROTAS_LIVRES = ['termos.aceitar', 'logout'];

    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (
            $user instanceof User
            && ! $request->isMethodSafe()
            && ! $request->routeIs(...self::ROTAS_LIVRES)
            && self::pendente($user)
        ) {
            return $request->expectsJson()
                ? response()->json(['message' => 'Aceite os termos de uso para continuar.'], 403)
                : back()->with('error', 'Aceite os termos de uso para continuar.');
        }

        return $next($request);
    }

    /**
     * true se o usuário ainda não aceitou a versão atual. Se a coluna ainda
     * não existe (migration pendente), não bloqueia nada.
     */
    public static function pendente(User $user): bool
    {
        if (! array_key_exists('termos_versao', $user->getAttributes())) {
            return false;
        }

        return $user->termos_versao !== config('termos.versao');
    }
}
