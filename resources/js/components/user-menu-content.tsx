import { Link, router } from '@inertiajs/react';
import { HelpCircle, LogOut, Settings } from 'lucide-react';
import {
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { UserInfo } from '@/components/user-info';
import { useMobileNavigation } from '@/hooks/use-mobile-navigation';
import { logout } from '@/routes';
import { edit } from '@/routes/profile';
import type { User } from '@/types';

type Props = {
    user: User;
};

export function UserMenuContent({ user }: Props) {
    const cleanup = useMobileNavigation();

    const handleLogout = () => {
        cleanup();
        router.flushAll();
    };

    return (
        <>
            {/* Animação da borda LED verde neon que contorna o menu */}
            <style>{`
                @keyframes menu-led-dash {
                    to { stroke-dashoffset: -100; }
                }
                .menu-led-stroke {
                    animation: menu-led-dash 8.6s linear infinite;
                    filter: drop-shadow(0 0 2px #34d399) drop-shadow(0 0 5px rgba(52, 211, 153, 0.8));
                }
            `}</style>

            <div className="relative -m-1 overflow-hidden rounded-md p-1">
                <DropdownMenuLabel className="p-0 font-normal">
                    <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                        <UserInfo user={user} showEmail={true} />
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                    <DropdownMenuItem asChild>
                        <Link
                            className="block w-full cursor-pointer"
                            href={edit()}
                            prefetch
                            onClick={cleanup}
                        >
                            <Settings className="mr-2" />
                            Configurações
                        </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                        <a
                            className="block w-full cursor-pointer"
                            href="/ajuda"
                            onClick={cleanup}
                        >
                            <HelpCircle className="mr-2" />
                            Ajuda
                        </a>
                    </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                    <Link
                        className="block w-full cursor-pointer"
                        href={logout()}
                        as="button"
                        onClick={handleLogout}
                        data-test="logout-button"
                    >
                        <LogOut className="mr-2" />
                        Sair
                    </Link>
                </DropdownMenuItem>

                {/* Contorno LED: traça só a borda arredondada, sem vazar do card */}
                <svg
                    className="pointer-events-none absolute inset-0 z-20 h-full w-full"
                    aria-hidden="true"
                >
                    <rect
                        x="1"
                        y="1"
                        width="calc(100% - 2px)"
                        height="calc(100% - 2px)"
                        rx="7"
                        fill="none"
                        stroke="#34d399"
                        strokeWidth="0.35"
                        strokeLinecap="round"
                        pathLength={100}
                        strokeDasharray="22 78"
                        className="menu-led-stroke"
                    />
                </svg>
            </div>
        </>
    );
}
