import { Link } from '@inertiajs/react';
import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { useCurrentUrl } from '@/hooks/use-current-url';
import type { NavItem } from '@/types';

export function NavMain({ items = [] }: { items: NavItem[] }) {
    const { isCurrentUrl } = useCurrentUrl();

    return (
        <SidebarGroup className="px-2 py-7">
            {}
            <SidebarGroupLabel className="text-zinc-500 dark:text-zinc-400">Navegação</SidebarGroupLabel>
            <SidebarMenu>
                {items.map((item) => (
                    <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton
                            asChild
                            isActive={isCurrentUrl(item.href)}
                            tooltip={{ children: item.title }}
                            className="py-5 text-zinc-800 dark:text-zinc-100 transition-colors hover:bg-[#00A460] hover:text-white dark:hover:text-white"
                        >
                            <Link href={item.href} prefetch className="flex items-center gap-3">
                                {item.icon && (
                                    <item.icon 
                                        className="!size-5 shrink-0" // O "!" garante que o tamanho seja aplicado
                                    />
                                )}
                                <span className="text-base">{item.title}</span> 
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                ))}
            </SidebarMenu>
        </SidebarGroup>
    );
}
