import { useState } from "react";
import { Head } from "@inertiajs/react";
import { Plus, ScrollText, Search, MoreHorizontal, Download, Filter, Check, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import Profile from "../settings/profile";
import { UserRound } from 'lucide-react';
import CreateApoliceModal from "@/components/modals/create-apolice-modal";
import { Button } from "@/components/ui/button";
import seguradoProfile from "@/components/modals/create-profile-modal";

export default function Apolices({ segurados, seguradoras, total, ramos, apolices}: any) {
    const [openModal, setOpenModal] = useState(false);

    return (
        <>
            <Head title="Apolices" />

            <div className="flex flex-col gap-6 p-6">
                
                {/* 1. Header da Página */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Apólices</h1>
                        <p className="text-sm text-muted-foreground">
                            Gerencie as apólices e segurados cadastrados
                        </p>
                    </div>
                    <Button onClick={() => setOpenModal(true)}>
                        <Plus className="size-4" />
                        Nova Apólice
                    </Button>
                </div>

                {/* 2. Cards de Estatísticas */}
                <div className="flex gap-4 justify-center">
                    <div className="flex flex-1 items-start justify-between rounded-xl border border-sidebar-border/70 p-6 bg-card shadow-sm">
                        <div className="flex flex-col gap-1">
                            <h2 className="text-sm font-medium text-muted-foreground">Total de Apólices</h2>
                            <p className="text-3xl font-bold tracking-tight text-green-500">{total}</p>
                        </div>
                        <UserRound className="size-10 text-muted-foreground/50"/>
                    </div>
                    <div className="flex flex-1 items-start justify-between rounded-xl border border-sidebar-border/70 p-6 bg-card shadow-sm">
                        <div className="flex flex-col gap-1">
                            <h2 className="text-sm font-medium text-muted-foreground">Apólices Ativas</h2>
                            <p className="text-3xl font-bold tracking-tight text-green-500">2</p>
                        </div>
                        <ScrollText className="size-10 text-muted-foreground/50" />
                    </div>

                    <div className="flex flex-1 items-start justify-between rounded-xl border border-sidebar-border/70 p-6 bg-card shadow-sm">
                        <div className="flex flex-col gap-1">
                            <h2 className="text-sm font-medium text-muted-foreground">Apólices Inativas</h2>
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
                            <h3 className="text-lg font-semibold">Lista de Apólices</h3>
                            <p className="text-xs text-muted-foreground">{total} apólice(s) encontrado(s)</p>
                        </div>

                        <div className="flex items-center gap-2">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                                <input 
                                    type="text" 
                                    placeholder="Buscar por apólice, CPF, Seguradora, vigência..." 
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
                                    <th className="h-12 px-4 text-left">Apólice</th>
                                    <th className="h-12 px-4 text-left">Tipo/Seguradora</th>
                                    <th className="h-12 px-4 text-left">Valor</th>
                                    <th className="h-12 px-4 text-left">Parcelas</th>
                                    <th className="h-12 px-4 text-left">Vigência</th>
                                    <th className="h-12 px-4 text-left">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {apolices.map((apolice: any) => (
                                    <tr key={apolice.id} className="border-b border-sidebar-border hover:bg-muted/50 transition-colors">
                                        <td className="h-12 px-4">{apolice.nome_completo}</td>
                                        <td className="h-12 px-4">{apolice.numero_apolice}</td>
                                        <td className="h-12 px-4">{apolice.nome_ramo} / {apolice.nome_fantasia}</td>
                                        <td className="h-12 px-4">R$ {apolice.valor_premio_total}</td>
                                        <td className="h-12 px-4">{apolice.quantidade_parcelas}</td>
                                        <td className="h-12 px-4">{apolice.inicio_vigencia} a {apolice.fim_vigencia}</td>
                                        <td className={`h-12 px-4 font-medium ${apolice.status === 'Ativa' ? 'text-green-500' : 'text-red-500'}`}>
                                            {apolice.status}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            <CreateApoliceModal open={openModal}  setOpen={setOpenModal} segurados={segurados} seguradoras={seguradoras} ramos={ramos} apolices={apolices} Profile={seguradoProfile} />
        </>
    );
}