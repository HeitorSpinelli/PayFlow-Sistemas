import { router } from '@inertiajs/react';
import { useEffect } from 'react';
import { toast } from 'sonner';
import type { FlashToast } from '@/types/ui';

/**
 * Mostra um toast quando o back-end manda um flash no formato
 * `Inertia::flash('toast', ['type' => ..., 'message' => ...])`.
 *
 * Chamado pelo <Toaster /> (components/ui/sonner.tsx), então vale para o app
 * todo. Hoje só as telas de Settings usam esse formato (ProfileController e
 * SecurityController — "Perfil atualizado", "Senha atualizada").
 *
 * As telas do PayFlow (Clientes, Pagamentos, Apólices...) usam outro caminho:
 * os controllers fazem `->with('success'|'error', ...)` e quem mostra o toast
 * é o useEffect do AppSidebarLayout, que lê `flash.success` / `flash.error`.
 */
export function useFlashToast(): void {
    useEffect(() => {
        return router.on('flash', (event) => {
            const flash = (event as CustomEvent).detail?.flash;
            const data = flash?.toast as FlashToast | undefined;

            if (!data) {
                return;
            }

            toast[data.type](data.message);
        });
    }, []);
}
