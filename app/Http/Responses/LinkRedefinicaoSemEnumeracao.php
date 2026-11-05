<?php

namespace App\Http\Responses;

use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Password;
use Laravel\Fortify\Contracts\FailedPasswordResetLinkRequestResponse;

/**
 * Resposta da tela "Esqueci a senha" quando o link NÃO foi enviado (e-mail
 * não cadastrado ou pedido repetido rápido demais).
 *
 * O padrão do Fortify devolvia "Não encontramos um usuário com esse e-mail",
 * o que deixava qualquer pessoa descobrir quais e-mails têm conta no sistema
 * (e então mirar o login neles). Aqui a resposta é idêntica à de sucesso:
 * quem tem conta recebe o e-mail; quem não tem, não — e a tela não revela qual
 * dos dois aconteceu.
 */
class LinkRedefinicaoSemEnumeracao implements FailedPasswordResetLinkRequestResponse
{
    public function __construct(protected string $status) {}

    public function toResponse($request)
    {
        $mensagem = trans(Password::RESET_LINK_SENT);

        return $request->wantsJson()
            ? new JsonResponse(['message' => $mensagem], 200)
            : back()->with('status', $mensagem);
    }
}
