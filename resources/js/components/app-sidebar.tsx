import { Link } from '@inertiajs/react';
import { usePage } from '@inertiajs/react';
import { 
    Grid, 
    Users, 
    FileCheck,  
    Wallet, 
    FileSpreadsheet,
    CalendarDays,
    Import, 
    Bell,
    Settings,
    Shield
} from 'lucide-react'; 
import AppLogo from '@/components/app-logo';
import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { dashboard } from '@/routes';
import type { NavItem } from '@/types';

// Aqui estão os ícones seguindo a ordem da sua imagem
// Itens do menu lateral, na ordem em que aparecem. `href` é a URL da rota
// em routes/web.php; `adminOnly: true` esconde o item de quem não é admin
// (as rotas desses itens também exigem `can:is-admin` no back-end, então
// esconder aqui é só para não mostrar um link que daria 403).
const mainNavItems: NavItem[] = [
    {
        title: 'Dashboard', //titulo do item
        href: dashboard(), //rota do item
        icon: Grid, // Ícone 1 (Quadradinhos)
    },
    {
        title: 'Clientes', //titulo do item
        href: '/clientes', //rota do item
        icon: Users, // Ícone 2 (Pessoas)
    },
    {
        title: 'Apólices',
        href: '/apolices',
        icon: FileCheck, // Ícone 3 (Documento)
    },
    {
        title: 'Pagamentos',
        href: '/pagamentos',
        icon: Wallet, // Ícone 5 (Cartão)
    },
    {
        title: 'Agenda',
        href: '/agenda',
        icon: CalendarDays, // Ícone 6 (Calendário)
    },
    {
        title: 'Importar',
        href: '/importar',
        icon: Import, // Ícone 7 (Upload)
    },
    {
        title: 'Notificações',
        href: '/notificacoes',
        adminOnly: true, // Somente visível para admins
        icon: Bell, // Ícone 8 (Balão de chat)
    },
    {
        title: 'Seguradoras e Ramos',
        href: '/seguradoras',
        adminOnly: true, // Somente visível para admins
        icon: Shield, // Ícone 9 (Prédio)
    },
    {
        title: 'Administração',
        href: '/administracao/usuarios',
        adminOnly: true, // Somente visível para admins
        icon: Settings, // Reutilizando o ícone de Pessoas para Administração
    }
];
// Links do rodapé da sidebar (acima do usuário). Vazio hoje.
const footerNavItems: NavItem[] = [
    
];

/**
 * Menu lateral de todas as telas autenticadas (montado pelo AppSidebarLayout).
 * De cima para baixo: logo (link para o Dashboard), itens de navegação
 * filtrados pelo papel do usuário, e no rodapé o NavUser (avatar/nome com o
 * menu de configurações e sair). `collapsible="icon"` permite recolher a
 * sidebar deixando só os ícones.
 */
export function AppSidebar() {

    // Usuário logado, compartilhado com todas as páginas pelo
    // HandleInertiaRequests::share() (props.auth.user).
    const {auth} = usePage().props as any;
    const user = auth.user;

    // Filtra os itens de navegação com base na função do usuário
    const filteredMainNavItems = mainNavItems.filter(item => {
        if (item.adminOnly && user.role !== 'admin') {
            return false; // Se o item é apenas para admins e o usuário não é admin, não exibe
        }
        return true; // Caso contrário, exibe o item
    });

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboard()} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent className="[&_svg]:size-6">
                {/* Basta chamar o NavMain uma vez, ele vai ler toda a lista mainNavItems */}
                <NavMain items={filteredMainNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
