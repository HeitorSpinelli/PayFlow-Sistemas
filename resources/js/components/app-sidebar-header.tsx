import { Link } from '@inertiajs/react';
import AppLogo from '@/components/app-logo';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { dashboard } from '@/routes';
import type { BreadcrumbItem as BreadcrumbItemType } from '@/types';

export function AppSidebarHeader({
    breadcrumbs = [],
}: {
    breadcrumbs?: BreadcrumbItemType[];
}) {
    return (
        // Abaixo de md (sidebar vira gaveta): cabeçalho fixo no topo com a
        // logo, para o usuário sempre ter o botão de menu à mão. Em md+ as
        // classes max-md:* não se aplicam — desktop inalterado.
        <header className="flex h-16 shrink-0 items-center gap-2 border-b border-sidebar-border/50 px-4 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 max-md:sticky max-md:top-0 max-md:z-30 max-md:h-14 max-md:bg-background/90 max-md:backdrop-blur-md md:px-4">
            <div className="flex items-center gap-2">
                <SidebarTrigger className="-ml-1 max-md:size-10" />
                <Breadcrumbs breadcrumbs={breadcrumbs} />
            </div>
            <Link
                href={dashboard()}
                className="ml-auto md:hidden [&_img]:p-1.5 [&>div>div:first-child]:size-9"
            >
                <AppLogo />
            </Link>
        </header>
    );
}
