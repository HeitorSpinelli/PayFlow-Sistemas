<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\Response;

/**
 * Foto de perfil (Configurações → Perfil). Aparece no card do perfil, no
 * avatar do menu lateral, no menu do usuário e na lista da Administração
 * (via user.avatar).
 *
 * A imagem fica no banco (tabela fotos_usuarios), não em disco: o banco é o
 * que todas as máquinas compartilham, então cada pessoa vê a foto das outras.
 * O navegador já reduz a imagem para 512px antes de enviar (profile.tsx).
 */
class AvatarController extends Controller
{
    /**
     * Botão "Alterar foto": valida e grava (ou substitui) a foto do usuário.
     */
    public function update(Request $request): RedirectResponse
    {
        $request->validate([
            'avatar' => ['required', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
        ], [
            'avatar.required' => 'Escolha uma imagem.',
            'avatar.image' => 'O arquivo precisa ser uma imagem.',
            'avatar.mimes' => 'Use uma imagem JPG, PNG ou WEBP.',
            'avatar.max' => 'A imagem pode ter no máximo 2 MB.',
            'avatar.uploaded' => 'Não foi possível enviar a imagem. Ela pode ter no máximo 2 MB.',
        ]);

        $arquivo = $request->file('avatar');
        $user = $request->user();

        // Foto e marcação no usuário juntas: nunca um sem o outro.
        DB::transaction(function () use ($arquivo, $user) {
            DB::table('fotos_usuarios')->updateOrInsert(
                ['user_id' => $user->id],
                [
                    'mime' => $arquivo->getMimeType(),
                    'conteudo' => base64_encode($arquivo->get()),
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
            );

            $user->forceFill(['avatar_atualizado_em' => now()])->save();
        });

        return back()->with('success', 'Foto de perfil atualizada.');
    }

    /**
     * Botão "Remover": volta para as iniciais.
     */
    public function destroy(Request $request): RedirectResponse
    {
        $user = $request->user();

        DB::transaction(function () use ($user) {
            DB::table('fotos_usuarios')->where('user_id', $user->id)->delete();
            $user->forceFill(['avatar_atualizado_em' => null])->save();
        });

        return back()->with('success', 'Foto de perfil removida.');
    }

    /**
     * Entrega a foto de qualquer usuário para quem está logado. O ?v= na URL
     * (ver User::getAvatarAttribute) muda a cada troca, então o navegador pode
     * guardar a imagem em cache e não buscar de novo a cada página.
     */
    public function show(User $user): Response
    {
        $foto = DB::table('fotos_usuarios')->where('user_id', $user->id)->first(['mime', 'conteudo']);

        abort_unless($foto, 404);

        return response(base64_decode($foto->conteudo), 200, [
            'Content-Type' => $foto->mime,
            'Cache-Control' => 'private, max-age=604800',
            'X-Content-Type-Options' => 'nosniff',
        ]);
    }
}
