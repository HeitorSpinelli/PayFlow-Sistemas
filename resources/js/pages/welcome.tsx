import { Head, Link, usePage } from '@inertiajs/react';
import { dashboard, login, register } from '@/routes';
import React from 'react';
import { UserRound, ArrowRight, LayoutDashboard, LogIn, UserPlus } from 'lucide-react';
import AppLogoIcon from '@/components/app-logo-icon';

export default function Welcome({
    canRegister = true,
}: {
    canRegister?: boolean;
}) {
    const { auth } = usePage().props;

    return (
        <>
            <Head title="Bem-vindo ao PayFlow" />
            
            <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2 bg-[#FDFDFC] text-[#1b1b18] dark:bg-[#0a0a0a] font-sans">
                
                {/* Lado Esquerdo: Imagem com Overlay Emerald Suave */}
                <div className="relative hidden lg:block h-screen overflow-hidden">
                    <img 
                        src="/images/happy-people.jpg" 
                        alt="Gestão de Clientes" 
                        className="absolute inset-0 h-full w-full object-cover"
                    />
                    {/* Overlay verde esmeralda com opacidade suave */}
                    <div className="absolute inset-0 bg-emerald-900/40 mix-blend-multiply"></div>
                    
                    {/* Gradiente para fusão com o fundo dark/light */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#FDFDFC] dark:to-[#0a0a0a] opacity-30"></div>
                    
                    {/* Card de Depoimento Flutuante */}
                    <div className="absolute bottom-10 left-10 right-10 max-w-md mx-auto">
                        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 text-white max-w-sm shadow-2xl">
                            <div className="flex gap-1 mb-3">
                                {[...Array(5)].map((_, i) => (
                                    <span key={i} className="text-emerald-400 text-xs">★</span>
                                ))}
                            </div>
                            <h3 className="text-lg font-medium italic">"O PayFlow simplificou nossa rotina. O controle de clientes nunca foi tão intuitivo."</h3>
                            <div className="mt-4 flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-emerald-500 flex items-center justify-center">
                                    <UserRound size={20} />
                                </div>
                                <div>
                                    <p className="text-sm font-bold leading-none">Equipe Financeira</p>
                                    <p className="text-xs text-emerald-200">Gestão Corporativa</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Lado Direito: Conteúdo alinhado ao topo */}
                <div className="flex flex-col items-center p-8 lg:p-20">
                    
                    {/* Header: Identidade e Títulos */}
                    <div className="w-full max-w-xl mb-auto">
                        <div className="flex items-center gap-2 mb-6">
                            <div className="h-8 w-8 bg-emerald-500 rounded-lg flex items-center justify-center shadow-lg shadow-emerald-500/20">
                                <AppLogoIcon className="h-8 w-5 fill-current text-white" />
                            </div>
                            <span className="text-sm font-black tracking-tighter text-emerald-600 dark:text-emerald-500 uppercase italic">
                                PayFlow-Sistemas
                            </span>
                        </div>
                        
                        <h1 className="text-4xl lg:text-6xl font-extrabold tracking-tight leading-[1.1] text-[#1b1b18] dark:text-[#EDEDEC]">
                            Seu sistemas de controle<span className="text-emerald-500"> de clientes e pagamentos.</span>
                        </h1>
                        
                        <p className="mt-6 text-lg text-[#1b1b18]/60 dark:text-[#EDEDEC]/60 max-w-lg leading-relaxed">
                            Acompanhe pagamentos, organize contatos e escale seu negócio com a plataforma mais ágil do mercado.
                        </p>
                    </div>

                    {/* Navegação/Ações Centralizadas */}
                    <nav className="flex flex-col items-center gap-4 w-full max-w-xs mb-auto pt-10">
                        {auth.user ? (
                            <Link
                                href={dashboard()}
                                className="group flex items-center justify-center gap-2 w-full rounded-xl bg-emerald-500 px-6 py-4 text-white font-bold transition-all duration-300 hover:bg-emerald-600 hover:scale-[1.02] active:scale-[0.98] shadow-xl shadow-emerald-500/20"
                            >
                                <LayoutDashboard size={18} />
                                Ir para Dashboard
                            </Link>
                        ) : (
                            <>
                                <Link
                                    href={login()}
                                    className="group flex items-center justify-center gap-2 w-full rounded-xl bg-[#1b1b18] dark:bg-[#EDEDEC] px-6 py-4 text-white dark:text-[#1b1b18] font-bold transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                                >
                                    <LogIn size={18} />
                                    Entrar no Sistema
                                </Link>
                                
                                {canRegister && (
                                    <Link
                                        href={register()}
                                        className="group flex items-center justify-center gap-2 w-full rounded-xl border-2 border-emerald-500/20 px-6 py-4 text-emerald-600 dark:text-emerald-400 font-bold transition-all duration-300 hover:bg-emerald-500/10 hover:border-emerald-500/40"
                                    >
                                        <UserPlus size={18} />
                                        Nova conta 
                                    </Link>
                                )}
                            </>
                        )}
                    </nav>
                    {/* Espaçador final */}
                    <footer className="w-full max-w-xl mt-auto text-center text-xs text-[#1b1b18]/40 dark:text-[#EDEDEC]/30">
                        &copy; 2026 PayFlow Inc. Todos os direitos reservados.
                    </footer>
                </div>
            </div>
        </>
    );
}