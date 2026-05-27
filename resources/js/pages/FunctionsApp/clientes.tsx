import { useState } from "react";
import { Head } from "@inertiajs/react";
import { Plus, ScrollText, Search, MoreHorizontal, Download, Filter, Check, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import Profile from "../settings/profile";
import { UserRound } from 'lucide-react';
import CreateSeguradoModal from '@/components/modals/create-segurado-modal'
import { Button } from "@/components/ui/button";

export default function Clientes({segurados}): any {
    // Modal do form para abrir o form de cadastro de segurados
    const [openModal, setOpenModal] = useState(false);

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
                    <Button onClick={() => setOpenModal(true)}>
                        <Plus className="size-4" />
                        Novo Cliente
                    </Button>
                </div>

                {/* 2. Cards de Estatísticas */}
                <div className="flex gap-4 justify-center">
                    <div className="flex flex-1 items-start justify-between rounded-xl border border-sidebar-border/70 p-6 bg-card shadow-sm">
                        <div className="flex flex-col gap-1">
                            <h2 className="text-sm font-medium text-muted-foreground">Total de Clientes</h2>
                            <p className="text-3xl font-bold tracking-tight text-green-500">2</p>
                        </div>
                        <UserRound className="size-10 text-muted-foreground/50"/>
                    </div>
                    <div className="flex flex-1 items-start justify-between rounded-xl border border-sidebar-border/70 p-6 bg-card shadow-sm">
                        <div className="flex flex-col gap-1">
                            <h2 className="text-sm font-medium text-muted-foreground">Clientes Ativos</h2>
                            <p className="text-3xl font-bold tracking-tight text-green-500">2</p>
                        </div>
                        <ScrollText className="size-10 text-muted-foreground/50" />
                    </div>

                    <div className="flex flex-1 items-start justify-between rounded-xl border border-sidebar-border/70 p-6 bg-card shadow-sm">
                        <div className="flex flex-col gap-1">
                            <h2 className="text-sm font-medium text-muted-foreground">Inativos</h2>
                            <p className="text-3xl font-bold tracking-tight text-red-500">0</p>
                        </div>
                        <ScrollText className="size-10 text-muted-foreground/50" />
                    </div>
                </div>

                {/* 3. Seção da Tabela */}
                <div className="rounded-xl border border-sidebar-border bg-card shadow-sm overflow-hidden">
                    
                    {/* Toolbar */}
                    <div className="p-4 border-b border-sidebar-border flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h3 className="text-lg font-semibold">Lista de Clientes</h3>
                            <p className="text-xs text-muted-foreground">2 cliente(s) encontrado(s)</p>
                        </div>

                        <div className="flex items-center gap-2">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                                <input 
                                    type="text" 
                                    placeholder="Buscar por nome, CPF..." 
                                    className="h-9 w-64 rounded-md border border-sidebar-border bg-background pl-9 pr-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                />
                            </div>
                            
                            <div className="relative">
                                <button className="inline-flex h-9 items-center justify-center rounded-md border border-sidebar-border bg-background px-3 text-sm font-medium gap-2 hover:bg-muted transition-colors min-w-[110px]">
                                    <Filter className="size-4 text-muted-foreground" />
                                    <span>Filtro</span>
                                    <ChevronDown className="size-4 text-muted-foreground" />
                                </button>
                            </div>

                            <button className="inline-flex h-9 items-center justify-center rounded-md border border-sidebar-border bg-background px-3 text-sm font-medium gap-2 hover:bg-muted transition-colors">
                                <Download className="size-4 text-muted-foreground" />
                                Exportar
                            </button>
                        </div>
                    </div>

                    {/* Tabela de segurados */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-sidebar-border bg-muted/30 text-muted-foreground font-medium">
                                    <th className="h-12 px-4 text-left">Cliente</th>
                                    <th className="h-12 px-4 text-left">CPF/CNPJ</th>
                                    <th className="h-12 px-4 text-left">Telefone</th>
                                    <th className="h-12 px-4 text-left">Localização</th>
                                    <th className="h-12 px-4 text-left">Status</th>
                                    <th className="h-12 px-4"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {segurados.map((segurado: any) => (
                                    <tr key={segurado.id} className="border-b border-sidebar-border hover:bg-muted/30 transition-colors">
                                        <td className="h-12 px-4">{segurado.nome_completo}</td>
                                        <td className="h-12 px-4">{segurado.cpf_cnpj}</td>
                                        <td className="h-12 px-4">{segurado.celular_whatsapp}</td>
                                        <td className="h-12 px-4">{segurado.cidade} - {segurado.estado}</td>
                                        <td className="h-12 px-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                segurado.status === 'Ativo' 
                                                ? 'bg-green-500/10 text-green-500' 
                                                : 'bg-red-500/10 text-red-500'
                                            }`}>
                                                {segurado.status}
                                            </span>
                                        </td>
                                        <td className="h-12 px-4"></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* 4. Paginação */}
                    <div className="flex items-center justify-between px-4 py-4 border-t border-sidebar-border bg-muted/10">
                        <div className="text-sm text-muted-foreground">
                            Mostrando <span className="font-medium text-foreground">1</span> de <span className="font-medium text-foreground">1</span> resultados
                        </div>
                        <div className="flex items-center gap-2">
                            <button className="inline-flex h-8 items-center justify-center rounded-md border border-sidebar-border bg-background px-3 text-xs font-medium gap-1 hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                                <ChevronLeft className="size-3"/>
                                Anterior
                            </button>
                            <button className="inline-flex h-8 items-center justify-center rounded-md border border-sidebar-border bg-background px-3 text-xs font-medium gap-1 hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                                Próxima
                                <ChevronRight className="size-3" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            <CreateSeguradoModal open={openModal} setOpen={setOpenModal} />
        </>
    );
}