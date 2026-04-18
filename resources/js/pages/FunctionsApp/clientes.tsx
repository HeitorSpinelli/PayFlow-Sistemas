import { useState } from "react";
import { Head } from "@inertiajs/react";
import { Plus, ScrollText, Search, MoreHorizontal, Download, Filter, Check, ChevronDown } from "lucide-react";
import Profile from "../settings/profile";
import { UserRound } from 'lucide-react';

export default function Clientes() {
    // Estado para controlar o Dropdown de Filtro
    const [filtroAberto, setFiltroAberto] = useState(false);
    const [filtroSelecionado, setFiltroSelecionado] = useState("Todos");

    const opcoesFiltro = ["Todos", "Ativos", "Inativos"];

    return (
        <>
            <Head title="Clientes" />
            
            <div className="flex flex-col gap-6 p-6">
                
                {/* 1. Header da Página */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Clientes</h1>
                        <p className="text-sm text-muted-foreground">
                            Gerencie os clientes e segurados cadastrados
                        </p>
                    </div>

                    <button className="inline-flex items-center justify-center gap-2 rounded-md bg-[#2D5A43] px-4 py-2 text-sm font-medium text-white hover:bg-[#244835] transition-colors shadow-sm">
                        <Plus className="size-5"/>
                        Novo Cliente
                    </button>
                </div>

                {/* 2. Cards de Estatísticas */}
                <div className="flex gap-4 justify-center">
                    <div className="flex flex-1 items-start justify-between rounded-xl border border-sidebar-border/70 p-6 bg-card shadow-sm">
                        <div className="flex flex-col gap-1">
                            <h2 className="text-sm font-medium text-muted-foreground">Total de Clientes</h2>
                            <p className="text-3xl font-bold tracking-tight text-green-500">2</p>
                        </div>
                        <UserRound className="size-10"/>
                    </div>
                    <div className="flex flex-1 items-start justify-between rounded-xl border border-sidebar-border/70 p-6 bg-card shadow-sm">
                        <div className="flex flex-col gap-1">
                            <h2 className="text-sm font-medium text-muted-foreground">Clientes Ativos</h2>
                            <p className="text-3xl font-bold tracking-tight text-green-500">2</p>
                        </div>
                        <ScrollText className="size-10" />
                    </div>

                    <div className="flex flex-1 items-start justify-between rounded-xl border border-sidebar-border/70 p-6 bg-card shadow-sm">
                        <div className="flex flex-col gap-1">
                            <h2 className="text-sm font-medium text-muted-foreground">Inativos</h2>
                            <p className="text-3xl font-bold tracking-tight text-red-500">0</p>
                        </div>
                        <ScrollText className="size-10" />
                    </div>
                </div>

                {/* 3. Seção da Tabela e Filtros */}
                <div className="rounded-xl border border-sidebar-border bg-card shadow-sm overflow-hidden">
                    
                    {/* Toolbar da Tabela */}
                    <div className="p-4 border-b border-sidebar-border flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h3 className="text-lg font-semibold">Lista de Clientes</h3>
                            <p className="text-xs text-muted-foreground">2 cliente(s) encontrado(s)</p>
                        </div>

                        <div className="flex items-center gap-2">
                            {/* Busca */}
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                                <input 
                                    type="text" 
                                    placeholder="Buscar por nome, CPF ou e-mail" 
                                    className="h-9 w-64 rounded-md border border-sidebar-border bg-background pl-9 pr-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                />
                            </div>
                            
                            {/* Dropdown de Filtro */}
                            <div className="relative">
                                <button 
                                    onClick={() => setFiltroAberto(!filtroAberto)}
                                    className="inline-flex h-9 items-center justify-center rounded-md border border-sidebar-border bg-background px-3 text-sm font-medium gap-2 hover:bg-muted transition-colors min-w-[110px]"
                                >
                                    <Filter className="size-4 text-muted-foreground" />
                                    {filtroSelecionado}
                                    <ChevronDown className={`size-4 text-muted-foreground transition-transform ${filtroAberto ? 'rotate-180' : ''}`} />
                                </button>

                                {filtroAberto && (
                                    <div className="absolute right-0 mt-2 w-40 rounded-lg border border-sidebar-border bg-background shadow-lg z-50 overflow-hidden py-1">
                                        {opcoesFiltro.map((opcao) => (
                                            <button
                                                key={opcao}
                                                onClick={() => {
                                                    setFiltroSelecionado(opcao);
                                                    setFiltroAberto(false);
                                                }}
                                                className={`flex w-full items-center justify-between px-3 py-2 text-sm transition-colors ${
                                                    filtroSelecionado === opcao 
                                                    ? 'bg-[#2D5A43] text-white' 
                                                    : 'hover:bg-muted text-foreground'
                                                }`}
                                            >
                                                {opcao}
                                                {filtroSelecionado === opcao && <Check className="size-4" />}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Botão Exportar */}
                            <button className="inline-flex h-9 items-center justify-center rounded-md border border-sidebar-border bg-background px-3 text-sm font-medium gap-2 hover:bg-muted transition-colors">
                                <Download className="size-4 text-muted-foreground" />
                                Exportar
                            </button>
                        </div>
                    </div>

                    {/* Tabela */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-sidebar-border bg-muted/30 text-muted-foreground">
                                    <th className="h-12 px-4 text-left font-medium">Cliente</th>
                                    <th className="h-12 px-4 text-left font-medium">CPF/CNPJ</th>
                                    <th className="h-12 px-4 text-left font-medium">Contato</th>
                                    <th className="h-12 px-4 text-left font-medium">Localização</th>
                                    <th className="h-12 px-4 text-left font-medium">Status</th>
                                    <th className="h-12 px-4 text-right font-medium"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-sidebar-border">
                                <tr className="hover:bg-muted/50 transition-colors">
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="size-9 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center font-bold text-xs text-zinc-500">S</div>
                                            <div className="flex flex-col">
                                                <span className="font-medium">Simon</span>
                                                <span className="text-[10px] text-muted-foreground uppercase">PJ</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4 text-muted-foreground">1234567891025</td>
                                    <td className="p-4 text-xs text-muted-foreground">
                                        heitorspinelli85@gmail.com<br/>19997221083
                                    </td>
                                    <td className="p-4 text-muted-foreground text-xs">Amparo, SP</td>
                                    <td className="p-4">
                                        <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                            Ativo
                                        </span>
                                    </td>
                                    <td className="p-4 text-right">
                                        <button className="p-2 hover:bg-muted rounded-md transition-colors">
                                            <MoreHorizontal className="size-4 text-muted-foreground" />
                                        </button>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </>
    );
}