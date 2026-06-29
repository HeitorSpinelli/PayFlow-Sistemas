import { useState } from "react";
import { Head } from "@inertiajs/react";
import { Plus, ScrollText, Search, MoreHorizontal, Download, Filter, Check, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { UserRound } from 'lucide-react';
import { X } from "lucide-react";
import CreateSeguradoModal from '@/components/modals/create-segurado-modal'
import { Button } from "@/components/ui/button";
import SeguradoProfileModal from "@/components/modals/create-profile-modal";
import { apolices, pagamentos } from "@/routes";
import { Input } from "@/components/ui/input";

//Recebe os segurados e o total de clientes como props e declarando seu tipo
export default function Clientes({segurados, total, seguradosinativos}: {segurados: any[], total: number, seguradosinativos: any[]}): any {

    const [openModal, setOpenModal] = useState(false);          // modal de criar
    const [openProfile, setOpenProfile] = useState(false);      // modal de perfil
    const [seguradoSelecionado, setSeguradoSelecionado] = useState<any>(null);
    const [filtroAberto, setFiltroAberto] = useState(false);
    const [filtroSelecionado, setFiltroSelecionado] = useState("Todos");
    const opcoesFiltro = ["Todos", "Ativos", "Inativos"];
    const [seguradoPesquisado, setSeguradoPesquisado] = useState("");

    const [exportarAberto, setExportarAberto] = useState(false);

    // Filtra a lista exibida com base no dropdown de status selecionado
    const seguradosFiltrados = segurados?.filter((segurado: any) => {
        if (filtroSelecionado === "Todos") return true;
        if (filtroSelecionado === "Ativos") return segurado.status === "Ativo";
        if (filtroSelecionado === "Inativos") return segurado.status === "Inativo";
        return true;
    }) ?? [];

    //Filtra com base na pesquisa do usuário
    const seguradosFiltradosComPesquisa = seguradosFiltrados.filter((segurado: any) => {
        const termoPesquisa = seguradoPesquisado.toLowerCase();
        return (
            segurado.nome_completo.toLowerCase().includes(termoPesquisa) ||
            segurado.cpf_cnpj.toLowerCase().includes(termoPesquisa)
        );
    });

    const abrirPerfil = (segurado: any) => {
        setSeguradoSelecionado(segurado);
        setOpenProfile(true);
    };

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
                            <p className="text-3xl font-bold tracking-tight text-green-500">{total}</p>
                        </div>
                        <UserRound className="size-10 text-muted-foreground/50"/>
                    </div>
                    <div className="flex flex-1 items-start justify-between rounded-xl border border-sidebar-border/70 p-6 bg-card shadow-sm">
                        <div className="flex flex-col gap-1">
                            <h2 className="text-sm font-medium text-muted-foreground">Clientes Ativos</h2>
                            <p className="text-3xl font-bold tracking-tight text-green-500">{segurados.filter((s) => s.status === 'Ativo').length}</p>
                        </div>
                        <ScrollText className="size-10 text-muted-foreground/50" />
                    </div>

                    <div className="flex flex-1 items-start justify-between rounded-xl border border-sidebar-border/70 p-6 bg-card shadow-sm">
                        <div className="flex flex-col gap-1">
                            <h2 className="text-sm font-medium text-muted-foreground">Inativos</h2>
                            <p className="text-3xl font-bold tracking-tight text-red-500">{seguradosinativos.length}</p>
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
                            <p className="text-xs text-muted-foreground">{total} cliente(s) encontrado(s)</p>
                        </div>

                        <div className="flex items-center gap-2">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                                <Input 
                                    placeholder="Buscar por nome, CPF..." 
                                    className="h-9 w-64 rounded-md border border-sidebar-border bg-background pl-9 pr-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                    value={seguradoPesquisado}
                                    onChange={(e) => setSeguradoPesquisado(e.target.value)}
                                />
                            </div>
                            
                            {/* Dropdown de filtro por status */}
                            <div className="relative">
                                <button
                                    onClick={() => {
                                        setFiltroAberto(!filtroAberto);
                                        // Fecha o dropdown de exportar ao abrir o de filtro
                                        setExportarAberto(false);
                                    }}
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
                                                    // Opção ativa: fundo verde escuro com texto branco
                                                    ? 'bg-[#2D5A43] text-white'
                                                    : 'hover:bg-muted text-foreground'
                                                }`}
                                            >
                                                {opcao}
                                                {/* Checkmark visível apenas na opção selecionada */}
                                                {filtroSelecionado === opcao && <Check className="size-4" />}
                                            </button>
                                        ))}
                                    </div>
                                )}
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
                                    <th className="h-12 px-4 text-left">ID</th>
                                    <th className="h-12 px-4 text-left">Cliente</th>
                                    <th className="h-12 px-4 text-left">CPF/CNPJ</th>
                                    <th className="h-12 px-4 text-left">Telefone</th>
                                    <th className="h-12 px-4 text-left">Localização</th>
                                    <th className="h-12 px-4 text-left">Status</th>
                                    <th className="h-12 px-4 text-left">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {segurados === null || seguradosFiltradosComPesquisa.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="h-12 px-4 text-center text-muted-foreground">
                                            Nenhum cliente encontrado.
                                        </td>
                                    </tr>
                                ) : (
                                    seguradosFiltradosComPesquisa.map((segurado: any) => (
                                    <tr key={segurado.id} className="border-b border-sidebar-border hover:bg-muted/30 transition-colors">
                                        <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                                            #{String(segurado.id).padStart(4, '0')}
                                        </td>
                                        <td className="h-12 px-4">{segurado.nome_completo}</td>
                                        <td className="h-12 px-4">{segurado.cpf_cnpj}</td>
                                        <td className="h-12 px-4">{segurado.telefone_fixo}</td>
                                        <td className="h-12 px-4">{segurado.cidade} - {segurado.estado}</td>
                                        <td className="h-12 px-4">
                                            <span className={`inline-flex px-2.5 py-0.5 rounded-md text-xs font-medium capitalize ${
                                                segurado.status === 'Ativo'
                                                ? 'bg-green-50 text-green-600'
                                                : 'bg-orange-50 text-orange-600'
                                            }`}>
                                                {segurado.status}
                                            </span>
                                        </td>
                                        <td className="h-12 px-4">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="rounded-lg"
                                                onClick={() => abrirPerfil(segurado)}  // ← abre o perfil, não o de criar
                                            >
                                                <MoreHorizontal className="size-4" />
                                            </Button>
                                        </td>
                                    </tr>
                                )))}   
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
            {/* Modal de criar cliente */}
            <CreateSeguradoModal open={openModal} setOpen={setOpenModal} />
            {seguradoSelecionado && (
                <SeguradoProfileModal
                    open={openProfile}
                    setOpen={setOpenProfile}
                    segurado={seguradoSelecionado}
                />
            )}
        </>
    )
}