import { Link } from '@inertiajs/react';
import { 
    LayoutGrid, 
    Users, 
    FileText, 
    Receipt, 
    CreditCard, 
    Calendar, 
    UploadCloud, 
    MessageSquare, 
    Settings,
    BookOpen,
    FolderGit2
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
const mainNavItems: NavItem[] = [
    {
        title: 'Dashboard', //titulo do item
        href: dashboard(), //rota do item
        icon: LayoutGrid, // Ícone 1 (Quadradinhos)
    },
    {
        title: 'Clientes', //titulo do item
        href: '/clientes', //rota do item
        icon: Users, // Ícone 2 (Pessoas)
    },
    {
        title: 'Apólices',
        href: '/apolices',
        icon: FileText, // Ícone 3 (Documento)
    },
    {
        title: 'Cobranças',
        href: '/cobrancas',
        icon: Receipt, // Ícone 4 (Cifrão/Recibo)
    },
    {
        title: 'Pagamentos',
        href: '/pagamentos',
        icon: CreditCard, // Ícone 5 (Cartão)
    },
    {
        title: 'Agenda',
        href: '/agenda',
        icon: Calendar, // Ícone 6 (Calendário)
    },
    {
        title: 'Importar',
        href: '/importar',
        icon: UploadCloud, // Ícone 7 (Upload)
    },
    {
        title: 'Notificações',
        href: '/notificacoes',
        icon: MessageSquare, // Ícone 8 (Balão de chat)
    },
    {
        title: 'Configurações',
        href: '/configurações',
        icon: Settings, // Ícone 9 (Engrenagem)
    },
];

const footerNavItems: NavItem[] = [
    
];

export function AppSidebar() {
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
                <NavMain items={mainNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
