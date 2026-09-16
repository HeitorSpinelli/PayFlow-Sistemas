import { Head, Link, usePage } from '@inertiajs/react';
import { dashboard, login } from '@/routes';
import React from 'react';
import { UserRound, ArrowRight, LayoutDashboard, LogIn } from 'lucide-react';
import AppLogoIcon from '@/components/app-logo-icon';

export default function Welcome() {
    const { auth } = usePage().props;

    return (
        <>
            <Head title="Bem-vindo ao PayFlow" />

            <div className="grid min-h-screen grid-cols-1 bg-[#FDFDFC] font-sans text-[#1b1b18] lg:grid-cols-2 dark:bg-[#0a0a0a]">
                {/* Lado Esquerdo: Imagem com Overlay Emerald Suave */}
                <div className="relative hidden h-screen overflow-hidden lg:block">
                    <img
                        src="/images/happy-people.jpg"
                        alt="Gestão de Clientes"
                        className="absolute inset-0 h-full w-full object-cover"
                    />
                    {/* Overlay verde esmeralda com opacidade suave */}
                    <div className="absolute inset-0 bg-emerald-900/40 mix-blend-multiply"></div>

                    {/* Gradiente para fusão com o fundo dark/light */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#FDFDFC] opacity-30 dark:to-[#0a0a0a]"></div>

                    {/* Card de Depoimento Flutuante */}
                    <div className="absolute right-10 bottom-10 left-10 mx-auto max-w-md">
                        <div className="max-w-sm rounded-2xl border border-white/20 bg-white/10 p-6 text-white shadow-2xl backdrop-blur-md">
                            <div className="mb-3 flex gap-1">
                                {[...Array(5)].map((_, i) => (
                                    <span
                                        key={i}
                                        className="text-xs text-emerald-400"
                                    >
                                        ★
                                    </span>
                                ))}
                            </div>
                            <h3 className="text-lg font-medium italic">
                                "O PayFlow simplificou nossa rotina. O controle
                                de clientes nunca foi tão intuitivo."
                            </h3>
                            <div className="mt-4 flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500">
                                    <UserRound size={20} />
                                </div>
                                <div>
                                    <p className="text-sm leading-none font-bold">
                                        Axxion
                                    </p>
                                    <p className="text-xs text-emerald-200">
                                        RH
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Lado Direito: Conteúdo alinhado ao topo */}
                <div className="flex flex-col items-center p-8 lg:p-20">
                    {/* Header: Identidade e Títulos */}
                    <div className="mb-auto w-full max-w-xl">
                        <div className="mb-6 flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500 shadow-lg shadow-emerald-500/20">
                                <AppLogoIcon className="h-8 w-5 fill-current text-white" />
                            </div>
                            <span className="text-sm font-black tracking-tighter text-emerald-600 uppercase italic dark:text-emerald-500">
                                PayFlow-Sistemas
                            </span>
                        </div>

                        <h1 className="text-4xl leading-[1.1] font-extrabold tracking-tight text-[#1b1b18] lg:text-6xl dark:text-[#EDEDEC]">
                            Seu sistemas de controle
                            <span className="text-emerald-500">
                                {' '}
                                de clientes e pagamentos.
                            </span>
                        </h1>

                        <p className="mt-6 max-w-lg text-lg leading-relaxed text-[#1b1b18]/60 dark:text-[#EDEDEC]/60">
                            Acompanhe pagamentos, organize contatos e escale seu
                            negócio com a plataforma mais ágil do mercado.
                        </p>
                    </div>

                    {/* Navegação/Ações Centralizadas */}
                    <nav className="mb-auto flex w-full max-w-xs flex-col items-center gap-4 pt-10">
                        {auth.user ? (
                            <Link
                                href={dashboard()}
                                className="group flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-6 py-4 font-bold text-white shadow-xl shadow-emerald-500/20 transition-all duration-300 hover:scale-[1.02] hover:bg-emerald-600 active:scale-[0.98]"
                            >
                                <LayoutDashboard size={18} />
                                Ir para Dashboard
                            </Link>
                        ) : (
                            <>
                                <Link
                                    href={login()}
                                    className="group flex w-full items-center justify-center gap-2 rounded-xl bg-[#1b1b18] px-6 py-4 font-bold text-white transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] dark:bg-[#EDEDEC] dark:text-[#1b1b18]"
                                >
                                    <LogIn size={18} />
                                    Entrar no Sistema
                                </Link>
                            </>
                        )}
                    </nav>
                    {/* Espaçador final */}
                    <footer className="mt-auto w-full max-w-xl text-center text-xs text-[#1b1b18]/40 dark:text-[#EDEDEC]/30">
                        &copy; 2026 PayFlow Inc. Todos os direitos reservados.
                    </footer>
                </div>
            </div>
        </>
    );
}
