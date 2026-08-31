import { AppContent } from '@/components/app-content';
import { AppShell } from '@/components/app-shell';
import { AppSidebar } from '@/components/app-sidebar';
import { AppSidebarHeader } from '@/components/app-sidebar-header';
import type { AppLayoutProps } from '@/types';
import { usePage } from '@inertiajs/react';
import { useEffect, useRef } from 'react';
import { toast } from 'sonner';

interface FlashProps {
    flash?: {
        success?: string | null;
        error?: string | null;
    };
}

export default function AppSidebarLayout({
    children,
    breadcrumbs = [],
}: AppLayoutProps) {
    const { flash } = usePage<FlashProps>().props;

    // Guarda a última mensagem já exibida. Um useRef não reseta entre
    // as duas execuções que o "strictMode: true" do Inertia força em
    // desenvolvimento — diferente de um useState, mudar essa ref não
    // causa re-render, e o valor persiste entre as chamadas do efeito.
    const ultimaMensagemMostrada = useRef<string | null>(null);

    // Sempre que uma navegação do Inertia trouxer uma flash message vinda
    // do backend (session('success') / session('error')), mostra o toast
    // correspondente. Como esse layout envolve todas as páginas autenticadas,
    // isso funciona globalmente — sem precisar repetir essa lógica em cada
    // modal ou formulário individualmente.
    useEffect(() => {
        const mensagemAtual = flash?.success ?? flash?.error ?? null;

        // Se não há mensagem nova, ou é a mesma que já mostramos
        // (caso do strictMode rodando o efeito duas vezes), não faz nada.
        if (
            !mensagemAtual ||
            mensagemAtual === ultimaMensagemMostrada.current
        ) {
            return;
        }

        ultimaMensagemMostrada.current = mensagemAtual;

        if (flash?.success) {
            toast.success(flash.success);
        }
        if (flash?.error) {
            toast.error(flash.error);
        }
    }, [flash]);

    return (
        <AppShell variant="sidebar">
            <AppSidebar />
            <AppContent variant="sidebar" className="overflow-x-hidden">
                <AppSidebarHeader breadcrumbs={breadcrumbs} />
                {children}
            </AppContent>
        </AppShell>
    );
}
