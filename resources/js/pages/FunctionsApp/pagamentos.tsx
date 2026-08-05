import { Head } from '@inertiajs/react';
import { useState } from 'react';
import {
    Search,
    Download,
    Filter,
    Plus,
    Check,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    CircleCheck,
    DollarSign,
    Receipt,
    Calendar,
    MoreHorizontal,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import CreatePagamentoModal from '@/components/modals/create-pagamentos-modal';
import PagamentoProfileModal from '@/components/modals/create-pagamento-profile-modal';

export default function Pagamentos({
    pagamentos,
    totalRecebido,
    totalRegistrado,
    totalConfirmados,
    totalPendentes,
    segurados,
    apolices,
}: any) {
    const [filtroAberto, setFiltroAberto] = useState(false);
    const [filtroSelecionado, setFiltroSelecionado] = useState('Todos');
    const opcoesFiltro = ['Todos', 'Confirmados', 'Pendentes'];

    const [busca, setBusca] = useState('');
    const [openModal, setOpenModal] = useState(false);

    // Modal de detalhes/exclusão do pagamento (mesmo padrão do perfil de Cliente)
    const [openProfile, setOpenProfile] = useState(false);
    const [pagamentoSelecionado, setPagamentoSelecionado] = useState<any>(null);

    const abrirPerfil = (pagamento: any) => {
        setPagamentoSelecionado(pagamento);
        setOpenProfile(true);
    };

    // Filtra a lista exibida com base no dropdown de status e no campo de busca
    const pagamentosFiltrados = (pagamentos ?? []).filter((p: any) => {
        const bateStatus =
            filtroSelecionado === 'Todos' ||
            (filtroSelecionado === 'Confirmados' &&
                p.status === 'confirmado') ||
            (filtroSelecionado === 'Pendentes' && p.status === 'pendente');

        const termo = busca.toLowerCase();
        const bateBusca =
            termo === '' ||
            p.cliente?.toLowerCase().includes(termo) ||
            p.apolice?.toLowerCase().includes(termo);

        return bateStatus && bateBusca;
    });

    const handleFiltroChange = (opcao: string) => {
        setFiltroSelecionado(opcao);
        setFiltroAberto(false);
    };

    // Formata número para o padrão monetário brasileiro
    const formatarMoeda = (valor: number) =>
        new Intl.NumberFormat('pt-BR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(valor ?? 0);

    // Formata a data ISO (vinda do banco) para dd/mm/aaaa
    const formatarData = (data: string) => {
        if (!data) return '—';
        const [ano, mes, dia] = data.split('T')[0].split('-');
        return `${dia}/${mes}/${ano}`;
    };

    return (
        <>
            <Head title="Pagamentos" />

            <div className="flex flex-col gap-6 p-6 sm:p-8">
                {/* 1. Header da Página */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <div className="mb-1 flex items-center gap-1.5 text-[10px] font-bold tracking-[0.16em] text-emerald-600 uppercase">
                            <span>Gestão</span>
                            <ChevronRight className="h-3 w-3" />
                            <span>Pagamentos</span>
                        </div>
                        <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
                            Pagamentos
                        </h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Gerencie os pagamentos e recebimentos cadastrados
                        </p>
                    </div>
                    <Button
                        onClick={() => setOpenModal(true)}
                        className="h-11 rounded-xl bg-emerald-500 px-5 font-bold text-white shadow-lg shadow-emerald-500/20 transition-all hover:bg-emerald-600 active:scale-[0.98]"
                    >
                        <Plus className="mr-2 size-4" />
                        Registrar Pagamento
                    </Button>
                </div>

                {/* 2. Cards de resumo financeiro com Glow / Efeito de Luz */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="relative flex items-center justify-between overflow-hidden rounded-2xl border border-border/70 bg-card p-5 shadow-sm transition-all duration-300 hover:scale-[1.02] hover:border-emerald-500/30">
                        <div className="pointer-events-none absolute -top-10 -right-10 h-32 w-32 rounded-full bg-emerald-500/10 blur-3xl"></div>
                        <div className="relative z-10 flex flex-col gap-1">
                            <span className="text-xs font-medium text-muted-foreground">
                                Total Recebido
                            </span>
                            <span className="text-2xl font-bold tracking-tight text-emerald-500 sm:text-3xl">
                                R$ {formatarMoeda(totalRecebido)}
                            </span>
                        </div>
                        <div className="relative z-10 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                            <DollarSign className="size-6" />
                        </div>
                    </div>

                    <div className="relative flex items-center justify-between overflow-hidden rounded-2xl border border-border/70 bg-card p-5 shadow-sm transition-all duration-300 hover:scale-[1.02] hover:border-emerald-500/30">
                        <div className="pointer-events-none absolute -top-10 -right-10 h-32 w-32 rounded-full bg-emerald-500/10 blur-3xl"></div>
                        <div className="relative z-10 flex flex-col gap-1">
                            <span className="text-xs font-medium text-muted-foreground">
                                Total Registrado
                            </span>
                            <span className="text-2xl font-bold tracking-tight text-emerald-500 sm:text-3xl">
                                R$ {formatarMoeda(totalRegistrado)}
                            </span>
                        </div>
                        <div className="relative z-10 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                            <Receipt className="size-6" />
                        </div>
                    </div>

                    <div className="relative flex items-center justify-between overflow-hidden rounded-2xl border border-border/70 bg-card p-5 shadow-sm transition-all duration-300 hover:scale-[1.02] hover:border-emerald-500/30">
                        <div className="pointer-events-none absolute -top-10 -right-10 h-32 w-32 rounded-full bg-emerald-500/10 blur-3xl"></div>
                        <div className="relative z-10 flex flex-col gap-1">
                            <span className="text-xs font-medium text-muted-foreground">
                                Confirmados
                            </span>
                            <span className="text-2xl font-bold tracking-tight text-emerald-500 sm:text-3xl">
                                {totalConfirmados ?? 0}
                            </span>
                        </div>
                        <div className="relative z-10 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                            <CircleCheck className="size-6" />
                        </div>
                    </div>

                    <div className="relative flex items-center justify-between overflow-hidden rounded-2xl border border-border/70 bg-card p-5 shadow-sm transition-all duration-300 hover:scale-[1.02] hover:border-amber-500/30">
                        <div className="pointer-events-none absolute -top-10 -right-10 h-32 w-32 rounded-full bg-amber-500/10 blur-3xl"></div>
                        <div className="relative z-10 flex flex-col gap-1">
                            <span className="text-xs font-medium text-muted-foreground">
                                Pendentes
                            </span>
                            {/* Pendentes usa âmbar para indicar atenção, diferente dos outros cards */}
                            <span className="text-2xl font-bold tracking-tight text-amber-500 sm:text-3xl">
                                {totalPendentes ?? 0}
                            </span>
                        </div>
                        <div className="relative z-10 flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.2)]">
                            <Calendar className="size-6" />
                        </div>
                    </div>
                </div>

                {/* 3. Seção da Tabela */}
                <div className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm">
                    {/* Toolbar */}
                    <div className="flex flex-col justify-between gap-4 border-b border-border/70 p-4 sm:p-5 lg:flex-row lg:items-center">
                        <div>
                            <h3 className="text-sm font-bold">
                                Lista de Pagamentos
                            </h3>
                            <p className="text-xs text-muted-foreground">
                                {pagamentosFiltrados.length} pagamento(s)
                                encontrado(s)
                            </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2.5">
                            <div className="relative">
                                <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground/60" />
                                <Input
                                    placeholder="Buscar por cliente, apólice..."
                                    value={busca}
                                    onChange={(e) => setBusca(e.target.value)}
                                    className="h-10 w-full rounded-xl border border-border/70 bg-background pr-3 pl-9 text-sm shadow-sm transition-all placeholder:text-muted-foreground/55 hover:border-emerald-500/40 focus-visible:ring-4 focus-visible:ring-emerald-500/10 focus-visible:outline-none sm:w-64"
                                />
                            </div>

                            {/* Dropdown de filtro por status */}
                            <div className="relative">
                                <button
                                    onClick={() =>
                                        setFiltroAberto(!filtroAberto)
                                    }
                                    className="inline-flex h-10 min-w-[120px] items-center justify-between gap-2 rounded-xl border border-border/70 bg-background px-3 text-sm font-medium shadow-sm transition-all hover:border-emerald-500/40 hover:bg-muted/50 focus:ring-4 focus:ring-emerald-500/10 focus:outline-none"
                                >
                                    <span className="flex items-center gap-2">
                                        <Filter className="size-4 text-muted-foreground/60" />
                                        {filtroSelecionado}
                                    </span>
                                    <ChevronDown
                                        className={`size-4 text-muted-foreground/60 transition-transform ${filtroAberto ? 'rotate-180' : ''}`}
                                    />
                                </button>

                                {filtroAberto && (
                                    <div className="absolute left-0 z-50 mt-2 w-40 overflow-hidden rounded-xl border border-border/70 bg-popover py-1.5 shadow-xl">
                                        {opcoesFiltro.map((opcao) => (
                                            <button
                                                key={opcao}
                                                onClick={() =>
                                                    handleFiltroChange(opcao)
                                                }
                                                className={`flex w-full cursor-pointer items-center justify-between px-3 py-2 text-sm transition-colors ${
                                                    filtroSelecionado === opcao
                                                        ? 'bg-emerald-500 font-medium text-white'
                                                        : 'text-popover-foreground hover:bg-muted'
                                                }`}
                                            >
                                                {opcao}
                                                {filtroSelecionado ===
                                                    opcao && (
                                                    <Check className="size-4" />
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* TODO: implementar lógica de exportação */}
                            <button className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-border/70 bg-background px-4 text-sm font-medium shadow-sm transition-all hover:border-emerald-500/40 hover:bg-muted/50 focus:ring-4 focus:ring-emerald-500/10 focus:outline-none">
                                <Download className="size-4 text-muted-foreground/60" />
                                Exportar
                            </button>
                        </div>
                    </div>

                    {/* Tabela de Pagamentos */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-border/70 bg-muted/[0.18] font-medium text-muted-foreground">
                                    <th className="h-11 px-4 text-left text-xs font-bold tracking-wider uppercase">
                                        ID
                                    </th>
                                    <th className="h-11 px-4 text-left text-xs font-bold tracking-wider uppercase">
                                        Cliente
                                    </th>
                                    <th className="h-11 px-4 text-left text-xs font-bold tracking-wider uppercase">
                                        Apólice / Parcela
                                    </th>
                                    <th className="h-11 px-4 text-left text-xs font-bold tracking-wider uppercase">
                                        Valor
                                    </th>
                                    <th className="h-11 px-4 text-left text-xs font-bold tracking-wider uppercase">
                                        Data Pagamento
                                    </th>
                                    <th className="h-11 px-4 text-left text-xs font-bold tracking-wider uppercase">
                                        Forma
                                    </th>
                                    <th className="h-11 px-4 text-left text-xs font-bold tracking-wider uppercase">
                                        Status
                                    </th>
                                    <th className="h-11 px-4 text-right text-xs font-bold tracking-wider uppercase">
                                        Ações
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {pagamentosFiltrados.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={8}
                                            className="h-24 px-4 text-center text-muted-foreground"
                                        >
                                            Nenhum pagamento encontrado.
                                        </td>
                                    </tr>
                                ) : (
                                    pagamentosFiltrados.map((p: any) => (
                                        <tr
                                            key={p.id}
                                            className="border-b border-border/70 transition-colors hover:bg-muted/[0.12]"
                                        >
                                            <td className="px-4 py-3.5 font-mono text-xs text-muted-foreground">
                                                #{String(p.id).padStart(4, '0')}
                                            </td>
                                            <td className="px-4 py-3.5 font-medium text-foreground">
                                                {p.cliente}
                                            </td>
                                            <td className="px-4 py-3.5 text-muted-foreground">
                                                {p.apolice} / {p.parcela}ª
                                            </td>
                                            <td className="px-4 py-3.5 text-foreground">
                                                R$ {formatarMoeda(p.valor)}
                                            </td>
                                            <td className="px-4 py-3.5 text-muted-foreground">
                                                {formatarData(p.data_pagamento)}
                                            </td>
                                            <td className="px-4 py-3.5 text-muted-foreground capitalize">
                                                {p.forma_pagamento}
                                            </td>
                                            <td className="px-4 py-3.5">
                                                <span
                                                    className={`inline-flex rounded-lg px-2.5 py-1 text-xs font-semibold capitalize ${
                                                        p.status ===
                                                        'confirmado'
                                                            ? 'border border-emerald-500/20 bg-emerald-500/10 text-emerald-600'
                                                            : 'border border-amber-500/20 bg-amber-500/10 text-amber-600'
                                                    }`}
                                                >
                                                    {p.status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3.5 text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() =>
                                                        abrirPerfil(p)
                                                    }
                                                    className="h-8 w-8 rounded-lg p-0 hover:bg-emerald-500/10 hover:text-emerald-500"
                                                >
                                                    <MoreHorizontal className="size-4" />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>

                        {/* 4. Paginação */}
                        <div className="flex items-center justify-between border-t border-border/70 bg-muted/[0.18] px-4 py-4 sm:px-5">
                            <div className="text-sm text-muted-foreground">
                                Mostrando{' '}
                                <span className="font-medium text-foreground">
                                    {pagamentosFiltrados.length}
                                </span>{' '}
                                de{' '}
                                <span className="font-medium text-foreground">
                                    {pagamentos?.length ?? 0}
                                </span>{' '}
                                resultados
                            </div>
                            <div className="flex items-center gap-2">
                                <button className="inline-flex h-9 items-center justify-center gap-1 rounded-xl border border-border/70 bg-background px-3 text-xs font-medium shadow-sm transition-all hover:border-emerald-500/40 hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50">
                                    <ChevronLeft className="size-3" />
                                    Anterior
                                </button>
                                <button className="inline-flex h-9 items-center justify-center gap-1 rounded-xl border border-border/70 bg-background px-3 text-xs font-medium shadow-sm transition-all hover:border-emerald-500/40 hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50">
                                    Próxima
                                    <ChevronRight className="size-3" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal de criação */}
            <CreatePagamentoModal
                open={openModal}
                setOpen={setOpenModal}
                segurados={segurados}
                apolices={apolices}
            />

            {/* Modal de detalhes/exclusão — só renderiza quando há um pagamento selecionado */}
            {pagamentoSelecionado && (
                <PagamentoProfileModal
                    open={openProfile}
                    setOpen={setOpenProfile}
                    pagamento={pagamentoSelecionado}
                />
            )}
        </>
    );
}
