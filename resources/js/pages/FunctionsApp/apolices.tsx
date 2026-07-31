import React, { useRef, useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import {
    Plus,
    ScrollText,
    Search,
    MoreHorizontal,
    Download,
    Filter,
    ChevronDown,
    UserRound,
    ChevronRight,
    ChevronLeft,
} from 'lucide-react';
import CreateApoliceModal from '@/components/modals/create-apolice-modal';
import CreateApoliceProfileModal from '@/components/modals/create-apolice-profile-modal';
import { Button } from '@/components/ui/button';
import { mascaraData } from '@/utils/dateMask';
import seguradoProfile from '@/components/modals/create-profile-modal';

interface PaginatedApolices {
    data: any[];
    current_page: number;
    last_page: number;
    from: number;
    to: number;
    total: number;
    prev_page_url: string | null;
    next_page_url: string | null;
    links: { url: string | null; label: string; active: boolean }[];
}

interface PageProps {
    segurados: PaginatedApolices;
    seguradoras: PaginatedApolices;
    total: number;
    ramos: PaginatedApolices;
    apolices: PaginatedApolices;
}

export default function Apolices({
    segurados,
    seguradoras,
    total,
    ramos,
    apolices,
}: PageProps) {
    const [openModal, setOpenModal] = useState(false);
    const [openApoliceProfile, setOpenApoliceProfile] = useState(false);
    const [apoliceSelecionada, setApoliceSelecionada] = useState<any>(null);
    const [filtroAberto, setFiltroAberto] = useState(false);

    const urlParams =
        typeof window !== 'undefined'
            ? new URLSearchParams(window.location.search)
            : new URLSearchParams();

    const [apolicePesquisada, setApolicePesquisada] = useState(
        urlParams.get('busca') || '',
    );

    const [filtroSelecionado, setFiltroSelecionado] = useState(
        urlParams.get('status') || 'Todos',
    );

    const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const abrirPerfil = (apolice: any) => {
        setApoliceSelecionada(apolice);
        setOpenApoliceProfile(true);
    };

    const formatarDataBR = (dataIso?: string) => {
    if (!dataIso) return '-';

    // Pega apenas a parte da data 'AAAA-MM-DD' caso venha com horário (ex: '2026-07-30T00:00:00')
    const dataApenas = dataIso.split('T')[0];

    // Se já estiver no formato 'AAAA-MM-DD', inverter antes de passar para a máscara
    const [ano, mes, dia] = dataApenas.split('-');
    if (ano && mes && dia) {
        return mascaraData(`${dia}${mes}${ano}`); // passa no formato de dígitos para a máscara
    }

    return mascaraData(dataIso);
};

    // Handler de busca com debounce
    const handleBuscaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const valor = e.target.value;
        setApolicePesquisada(valor);

        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }

        searchTimeoutRef.current = setTimeout(() => {
            const params = new URLSearchParams(window.location.search);

            if (valor.trim() !== '') {
                params.set('busca', valor);
            } else {
                params.delete('busca');
            }
            params.delete('page');

            router.get(
                window.location.pathname,
                Object.fromEntries(params.entries()),
                {
                    preserveState: true,
                    preserveScroll: true,
                    replace: true,
                },
            );
        }, 300);
    };

    // Handler de filtro por status
    const handleFiltroChange = (opcao: string) => {
        setFiltroSelecionado(opcao);
        setFiltroAberto(false);

        const params = new URLSearchParams(window.location.search);

        if (opcao !== 'Todos') {
            params.set('status', opcao);
        } else {
            params.delete('status');
        }
        params.delete('page');

        router.get(
            window.location.pathname,
            Object.fromEntries(params.entries()),
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            },
        );
    };

    const listaApolices = apolices?.data || [];

    return (
        <>
            <Head title="Apólices" />
            <div className="flex flex-col gap-6 p-6">
                {/* 1. Header da Página */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">
                            Apólices
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Gerencie as apólices e segurados cadastrados
                        </p>
                    </div>
                    <Button
                        onClick={() => setOpenModal(true)}
                        className="rounded-xl bg-emerald-500 text-white hover:bg-emerald-600"
                    >
                        <Plus className="mr-1 size-4" />
                        Nova Apólice
                    </Button>
                </div>

                {/* 2. Cards de Estatísticas */}
                <div className="flex justify-center gap-4">
                    <div className="flex flex-1 items-start justify-between rounded-xl border border-sidebar-border/70 bg-card p-6 shadow-sm">
                        <div className="flex flex-col gap-1">
                            <h2 className="text-sm font-medium text-muted-foreground">
                                Total de Apólices
                            </h2>
                            <p className="text-3xl font-bold tracking-tight text-emerald-500">
                                {total || apolices?.total || 0}
                            </p>
                        </div>
                        <UserRound className="size-10 text-muted-foreground/50" />
                    </div>
                    <div className="flex flex-1 items-start justify-between rounded-xl border border-sidebar-border/70 bg-card p-6 shadow-sm">
                        <div className="flex flex-col gap-1">
                            <h2 className="text-sm font-medium text-muted-foreground">
                                Apólices Ativas
                            </h2>
                            <p className="text-3xl font-bold tracking-tight text-emerald-500">
                                2
                            </p>
                        </div>
                        <ScrollText className="size-10 text-muted-foreground/50" />
                    </div>
                    <div className="flex flex-1 items-start justify-between rounded-xl border border-sidebar-border/70 bg-card p-6 shadow-sm">
                        <div className="flex flex-col gap-1">
                            <h2 className="text-sm font-medium text-muted-foreground">
                                Apólices Inativas
                            </h2>
                            <p className="text-3xl font-bold tracking-tight text-red-500">
                                0
                            </p>
                        </div>
                        <ScrollText className="size-10 text-muted-foreground/50" />
                    </div>
                </div>

                {/* 3. Seção da Tabela */}
                <div className="overflow-hidden rounded-xl border border-sidebar-border bg-card shadow-sm">
                    {/* Toolbar */}
                    <div className="flex flex-col justify-between gap-4 border-b border-sidebar-border p-4 md:flex-row md:items-center">
                        <div>
                            <h3 className="text-lg font-semibold">
                                Lista de Apólices
                            </h3>
                            <p className="text-xs text-muted-foreground">
                                {apolices?.total || 0} apólice(s) encontrada(s)
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            {/* Busca */}
                            <div className="relative">
                                <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                                <input
                                    type="text"
                                    placeholder="Buscar por apólice, cliente, seguradora..."
                                    value={apolicePesquisada}
                                    onChange={handleBuscaChange}
                                    className="h-9 w-64 rounded-md border border-sidebar-border bg-background pr-3 pl-9 text-sm focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
                                />
                            </div>

                            {/* Filtro Dropdown */}
                            <div className="relative">
                                <button
                                    onClick={() =>
                                        setFiltroAberto(!filtroAberto)
                                    }
                                    className="inline-flex h-9 min-w-[110px] items-center justify-center gap-2 rounded-md border border-sidebar-border bg-background px-3 text-sm font-medium transition-colors hover:bg-muted"
                                >
                                    <Filter className="size-4 text-muted-foreground" />
                                    <span>{filtroSelecionado}</span>
                                    <ChevronDown className="size-4 text-muted-foreground" />
                                </button>

                                {filtroAberto && (
                                    <div className="absolute right-0 z-20 mt-2 w-40 rounded-md border border-sidebar-border bg-card py-1 shadow-lg">
                                        {['Todos', 'Renovadas', 'Vencidas'].map(
                                            (opcao) => (
                                                <button
                                                    key={opcao}
                                                    onClick={() =>
                                                        handleFiltroChange(
                                                            opcao,
                                                        )
                                                    }
                                                    className={`w-full px-3 py-1.5 text-left text-sm transition-colors hover:bg-muted ${
                                                        filtroSelecionado ===
                                                        opcao
                                                            ? 'font-semibold text-emerald-600'
                                                            : ''
                                                    }`}
                                                >
                                                    {opcao}
                                                </button>
                                            ),
                                        )}
                                    </div>
                                )}
                            </div>

                            <button className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-sidebar-border bg-background px-3 text-sm font-medium transition-colors hover:bg-muted">
                                <Download className="size-4 text-muted-foreground" />
                                Exportar
                            </button>
                        </div>
                    </div>

                    {/* Tabela */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-sidebar-border bg-muted/30 font-medium text-muted-foreground">
                                    <th className="px-4 py-3 text-left">ID</th>
                                    <th className="px-4 py-3 text-left">
                                        Segurado
                                    </th>
                                    <th className="px-4 py-3 text-left">
                                        Número da Apólice
                                    </th>
                                    <th className="px-4 py-3 text-left">
                                        Ramo / Seguradora
                                    </th>
                                    <th className="px-4 py-3 text-left">
                                        Valor do Prêmio
                                    </th>
                                    <th className="px-4 py-3 text-left">
                                        Parcelas
                                    </th>
                                    <th className="px-4 py-3 text-left">
                                        Vigência
                                    </th>
                                    <th className="px-4 py-3 text-left">
                                        Ações
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {listaApolices.length > 0 ? (
                                    listaApolices.map((apolice: any) => (
                                        <tr
                                            key={apolice.id}
                                            className="border-b border-sidebar-border transition-colors hover:bg-muted/50"
                                        >
                                            <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                                                #
                                                {String(apolice.id).padStart(
                                                    4,
                                                    '0',
                                                )}
                                            </td>
                                            <td className="h-12 px-4 font-medium">
                                                {apolice.cliente
                                                    ?.nome_completo ||
                                                    apolice.cliente?.nome ||
                                                    apolice.nome_completo ||
                                                    '-'}
                                            </td>
                                            <td className="h-12 px-4">
                                                {apolice.numero_apolice}
                                            </td>
                                            <td className="h-12 px-4">
                                                {apolice.ramo?.nome ||
                                                    apolice.ramo?.nome_ramo ||
                                                    apolice.ramo?.descricao ||
                                                    '-'}{' '}
                                                /{' '}
                                                {apolice.seguradora
                                                    ?.nome_fantasia ||
                                                    apolice.seguradora?.nome ||
                                                    '-'}
                                            </td>
                                            <td className="h-12 px-4">
                                                R$ {apolice.valor_premio_total}
                                            </td>
                                            <td className="h-12 px-4">
                                                {apolice.quantidade_parcelas}
                                            </td>
                                            <td className="h-12 px-4">
                                                {formatarDataBR(
                                                    apolice.inicio_vigencia,
                                                )}{' '}
                                                -{' '}
                                                {formatarDataBR(
                                                    apolice.fim_vigencia,
                                                )}
                                            </td>
                                            <td className="h-12 px-4">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() =>
                                                        abrirPerfil(apolice)
                                                    }
                                                    className="h-8 w-8 rounded-lg p-0"
                                                >
                                                    <MoreHorizontal className="size-4" />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td
                                            colSpan={8}
                                            className="py-8 text-center text-muted-foreground"
                                        >
                                            Nenhuma apólice encontrada.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>

                        {/* Paginação */}
                        <div className="flex items-center justify-between border-t border-sidebar-border bg-muted/10 px-4 py-4">
                            <div className="text-sm text-muted-foreground">
                                Mostrando{' '}
                                <span className="font-medium text-foreground">
                                    {apolices?.from || 0}
                                </span>{' '}
                                até{' '}
                                <span className="font-medium text-foreground">
                                    {apolices?.to || 0}
                                </span>{' '}
                                de{' '}
                                <span className="font-medium text-foreground">
                                    {apolices?.total || 0}
                                </span>{' '}
                                resultados
                            </div>
                            <div className="flex items-center gap-2">
                                {apolices?.prev_page_url ? (
                                    <Link
                                        href={apolices.prev_page_url}
                                        className="inline-flex h-8 items-center justify-center gap-1 rounded-md border border-sidebar-border bg-background px-3 text-xs font-medium transition-colors hover:bg-muted"
                                    >
                                        <ChevronLeft className="size-3" />
                                        Anterior
                                    </Link>
                                ) : (
                                    <button
                                        disabled
                                        className="inline-flex h-8 cursor-not-allowed items-center justify-center gap-1 rounded-md border border-sidebar-border bg-background px-3 text-xs font-medium opacity-50"
                                    >
                                        <ChevronLeft className="size-3" />
                                        Anterior
                                    </button>
                                )}

                                {apolices?.next_page_url ? (
                                    <Link
                                        href={apolices.next_page_url}
                                        className="inline-flex h-8 items-center justify-center gap-1 rounded-md border border-sidebar-border bg-background px-3 text-xs font-medium transition-colors hover:bg-muted"
                                    >
                                        Próxima
                                        <ChevronRight className="size-3" />
                                    </Link>
                                ) : (
                                    <button
                                        disabled
                                        className="inline-flex h-8 cursor-not-allowed items-center justify-center gap-1 rounded-md border border-sidebar-border bg-background px-3 text-xs font-medium opacity-50"
                                    >
                                        Próxima
                                        <ChevronRight className="size-3" />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modais */}
            <CreateApoliceModal
                open={openModal}
                setOpen={setOpenModal}
                segurados={segurados}
                seguradoras={seguradoras}
                ramos={ramos}
                apolices={apolices}
                Profile={seguradoProfile}
            />
            {apoliceSelecionada && (
                <CreateApoliceProfileModal
                    open={openApoliceProfile}
                    ramos={ramos}
                    setOpen={setOpenApoliceProfile}
                    apolice={apoliceSelecionada}
                />
            )}
        </>
    );
}
