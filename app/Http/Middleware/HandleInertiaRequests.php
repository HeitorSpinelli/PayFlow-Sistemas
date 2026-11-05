<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;

/**
 * Middleware do Inertia: define as props compartilhadas por todas as telas.
 */
class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     *
     * Props disponíveis em todas as páginas: auth.user (nome no menu, cargo usado
     * para esconder botões de admin), sidebarOpen (estado da barra lateral) e
     * flash success/error (viram os toasts verdes/vermelhos do layout).
     */
    public function share(Request $request): array
    {
        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'auth' => [
                'user' => $request->user(),
            ],
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',

            // Janela de aceite dos termos (ModalTermos) e página /termos.
            // pendente = ainda não aceitou a versão atual; atualizacao = já
            // tinha aceitado uma versão anterior (o texto da janela muda).
            'termos' => fn () => $request->user() ? [
                'versao' => config('termos.versao'),
                'vigenteDesde' => config('termos.vigente_desde'),
                'responsavel' => config('termos.responsavel'),
                'contato' => config('termos.email_contato'),
                'pendente' => ExigirAceiteDosTermos::pendente($request->user()),
                'atualizacao' => $request->user()->termos_versao !== null,
                'aceitoEm' => $request->user()->termos_aceitos_em,
                'versaoAceita' => $request->user()->termos_versao,
            ] : null,
            
            'flash' => [
                'success' => session('success'),
                'error' => session('error'),
            ],
        ];
    }
}
