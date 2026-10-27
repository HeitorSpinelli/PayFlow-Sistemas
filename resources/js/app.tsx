import { createInertiaApp } from '@inertiajs/react';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { initializeTheme } from '@/hooks/use-appearance';
import AppLayout from '@/layouts/app-layout';
import AuthLayout from '@/layouts/auth-layout';
import SettingsLayout from '@/layouts/settings/layout';

// Ponto de entrada do front-end: inicializa o Inertia, que recebe do Laravel
// o nome da página (ex.: 'FunctionsApp/pagamentos') + props e renderiza o
// componente correspondente em resources/js/pages.

// Nome exibido na aba do navegador (vem do .env, VITE_APP_NAME).
const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

createInertiaApp({
    // Título da aba: "<título do <Head> da página> - <nome do app>".
    title: (title) => (title ? `${title} - ${appName}` : appName),
    // Escolhe o layout que envolve cada página pelo nome dela:
    // - welcome: tela pública, sem layout (sem sidebar);
    // - auth/*: login, recuperação de senha etc. (AuthLayout, sem sidebar);
    // - settings/*: telas de perfil/senha, com sidebar + menu lateral de configurações;
    // - todo o resto (dashboard, FunctionsApp/*): AppLayout, com sidebar,
    //   cabeçalho, toasts de flash e o widget do Dininho.
    layout: (name) => {
        switch (true) {
            case name === 'welcome':
                return null;
            case name.startsWith('auth/'):
                return AuthLayout;
            case name.startsWith('settings/'):
                return [AppLayout, SettingsLayout];
            default:
                return AppLayout;
        }
    },
    strictMode: true,
    // Envolve o app inteiro: TooltipProvider (dicas ao passar o mouse) e o
    // <Toaster /> — o container onde aparecem os toasts de sucesso/erro.
    withApp(app) {
        return (
            <TooltipProvider delayDuration={500}>
                {app}
                <Toaster />
            </TooltipProvider>
        );
    },
    // Barra de progresso verde no topo da tela durante cada navegação.
    progress: {
        color: '#44884f',
    },
});

// This will set light / dark mode on load...
initializeTheme();
