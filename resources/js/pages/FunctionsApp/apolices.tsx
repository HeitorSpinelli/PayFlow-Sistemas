import { useState, useRef } from 'react';
import { Head, router } from '@inertiajs/react';
import {
    Plus,
    ScrollText,
    Search,
    MoreHorizontal,
    Download,
    Filter,
    Check,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    UserRound,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import CreateApoliceModal from '@/components/modals/create-apolice-modal';
import CreateApoliceProfileModal from '@/components/modals/create-apolice-profile-modal';
import seguradoProfile from '@/components/modals/create-profile-modal';

import { formataInputBusca, removeMask } from '@/utils/Masks';

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
    segurados?: any[];
    seguradoras?: any[];
    ramos?: any[];
    apolices?: any[];
    total?: number;
    totalAtivas?: number;
    totalInativas?: number;
}

type StatusVigencia = 'Vigente' | 'Para Renovar' | 'A Iniciar' | string;

export default function Apolices({
    segurados,
    seguradoras,
    ramos,
    apolices = [],
    total = 0,
    totalAtivas = 2,
    totalInativas = 0,
}: PageProps) {
    const [openModal, setOpenModal] = useState(false); // modal de criar
    const [openApoliceProfile, setOpenApoliceProfile] = useState(false); // modal de perfil da apólice
    const [apoliceSelecionada, setApoliceSelecionada] = useState<any>(null); // apólice selecionada para o perfil
    const [filtroAberto, setFiltroAberto] = useState(false);
    const opcoesFiltro = ['Todas', 'Vigente', 'A Iniciar', 'Para Renovar'];

    const getStatusBadgeStyle = (status: string) => {
        switch (status) {
            case 'Vigente':
                return 'bg-emerald-500/10 text-emerald-500';
            case 'Para Renovar':
                return 'bg-red-500/10 text-red-500';
            case 'A Iniciar':
                return 'bg-blue-500/10 text-blue-500';
            default:
                return 'bg-rose-500/10 text-rose-500';
        }
    };

    const abrirPerfil = (apolice: any) => {
        setApoliceSelecionada(apolice);
        setOpenApoliceProfile(true);
    };

    const formatarDataBR = (dataString: string) => {
        if (!dataString) return '-';
        const [ano, mes, dia] = dataString.split('T')[0].split('-');
        return `${dia}/${mes}/${ano}`;
    };

    // Lê os parâmetros atuais da URL para inicializar os estados corretamente
    const urlParams =
        typeof window !== 'undefined'
            ? new URLSearchParams(window.location.search)
            : new URLSearchParams();

    const [busca, setBusca] = useState(urlParams.get('busca') || '');
    const [filtroSelecionado, setFiltroSelecionado] = useState(
        urlParams.get('status') || 'Todos',
    );

    // Ref para controlar o debounce da busca
    const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Função de busca acionada ao digitar com debounce (dispara a busca no Back-end via Inertia)
    const handleBuscaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const valorDigitado = e.target.value;
        setBusca(formataInputBusca(valorDigitado));

        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }

        searchTimeoutRef.current = setTimeout(() => {
            const params = new URLSearchParams(window.location.search);

            // Se for número (provável CPF/CNPJ), envia limpo, senão envia o texto
            const temLetras = /[a-zA-Z]/.test(valorDigitado);
            const valorParaEnviar = temLetras
                ? valorDigitado
                : removeMask(valorDigitado);

            if (valorDigitado.trim() !== '') {
                params.set('busca', valorParaEnviar);
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
        }, 500);
    };

    // Função acionada ao selecionar um filtro de status
    const handleFiltroChange = (opcao: string) => {
        setFiltroSelecionado(opcao);
        setFiltroAberto(false);

        const params = new URLSearchParams(window.location.search);

        if (opcao !== 'Todos') {
            params.set('status', opcao);
        } else {
            params.delete('status');
        }
        params.delete('page'); // Reseta para a página 1 ao alterar o filtro

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

    // Usamos diretamente o array de apólices que vem filtrado do backend
    const apolicesFiltradas = apolices.data || [];

    return (
        <>
            <Head title="Apólices" />

            <div className="flex flex-col gap-6 p-6 sm:p-8">
                {/* 1. Header da Página */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <div className="mb-1 flex items-center gap-1.5 text-[10px] font-bold tracking-[0.16em] text-emerald-600 uppercase">
                            <span>Gestão</span>
                            <ChevronRight className="h-3 w-3" />
                            <span>Apólices</span>
                        </div>
                        <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
                            Apólices
                        </h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Gerencie as apólices e segurados cadastrados
                        </p>
                    </div>
                    <Button
                        onClick={() => setOpenModal(true)}
                        className="h-11 rounded-xl bg-emerald-500 px-5 font-bold text-white shadow-lg shadow-emerald-500/20 transition-all hover:bg-emerald-600 active:scale-[0.98]"
                    >
                        <Plus className="mr-2 size-4" />
                        Nova Apólice
                    </Button>
                </div>

                {/* 2. Cards de Estatísticas com Glow / Efeito de Luz */}
                <div className="grid gap-4 sm:grid-cols-3">
                    <div className="relative flex items-center justify-between overflow-hidden rounded-2xl border border-border/70 bg-card p-5 shadow-sm transition-all duration-300 hover:scale-[1.02] hover:border-emerald-500/30">
                        <div className="pointer-events-none absolute -top-10 -right-10 h-32 w-32 rounded-full bg-emerald-500/10 blur-3xl"></div>
                        <div className="relative z-10 flex flex-col gap-1">
                            <span className="text-xs font-medium text-muted-foreground">
                                Total de Apólices
                            </span>
                            <span className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                                {total}
                            </span>
                        </div>
                        <div className="relative z-10 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                            <UserRound className="size-6" />
                        </div>
                    </div>
                    <div className="relative flex items-center justify-between overflow-hidden rounded-2xl border border-border/70 bg-card p-5 shadow-sm transition-all duration-300 hover:scale-[1.02] hover:border-emerald-500/30">
                        <div className="pointer-events-none absolute -top-10 -right-10 h-32 w-32 rounded-full bg-emerald-500/10 blur-3xl"></div>
                        <div className="relative z-10 flex flex-col gap-1">
                            <span className="text-xs font-medium text-muted-foreground">
                                Apólices Ativas
                            </span>
                            <span className="text-2xl font-bold tracking-tight text-emerald-500 sm:text-3xl">
                                {totalAtivas}
                            </span>
                        </div>
                        <div className="relative z-10 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                            <ScrollText className="size-6" />
                        </div>
                    </div>
                    <div className="relative flex items-center justify-between overflow-hidden rounded-2xl border border-border/70 bg-card p-5 shadow-sm transition-all duration-300 hover:scale-[1.02] hover:border-rose-500/30">
                        <div className="pointer-events-none absolute -top-10 -right-10 h-32 w-32 rounded-full bg-rose-500/10 blur-3xl"></div>
                        <div className="relative z-10 flex flex-col gap-1">
                            <span className="text-xs font-medium text-muted-foreground">
                                Apólices Inativas
                            </span>
                            <span className="text-2xl font-bold tracking-tight text-rose-500 sm:text-3xl">
                                {totalInativas}
                            </span>
                        </div>
                        <div className="relative z-10 flex h-12 w-12 items-center justify-center rounded-xl bg-rose-500/10 text-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.2)]">
                            <ScrollText className="size-6" />
                        </div>
                    </div>
                </div>

                {/* 3. Seção da Tabela */}
                <div className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm">
                    {/* Toolbar */}
                    <div className="flex flex-col justify-between gap-4 border-b border-border/70 p-4 sm:p-5 lg:flex-row lg:items-center">
                        <div>
                            <h3 className="text-sm font-bold">
                                Lista de Apólices
                            </h3>
                            <p className="text-xs text-muted-foreground">
                                {apolicesFiltradas.length} apólice(s)
                                encontrada(s)
                            </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2.5">
                            <div className="relative">
                                <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground/60" />
                                <Input
                                    placeholder="Buscar por apólice, cliente, CPF..."
                                    className="h-10 w-full rounded-xl border border-border/70 bg-background pr-3 pl-9 text-sm shadow-sm transition-all placeholder:text-muted-foreground/55 hover:border-emerald-500/40 focus-visible:ring-4 focus-visible:ring-emerald-500/10 focus-visible:outline-none sm:w-64"
                                    value={busca}
                                    onChange={handleBuscaChange}
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
                            <a
                                href="/apolices/exportar"
                                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-border/70 bg-background px-4 text-sm font-medium shadow-sm transition-all hover:border-emerald-500/40 hover:bg-muted/50 focus:ring-4 focus:ring-emerald-500/10 focus:outline-none"
                            >
                                <Download className="size-4 text-muted-foreground/60" />
                                Exportar
                            </a>
                        </div>
                    </div>

                    {/* Tabela de Apólices */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-border/70 bg-muted/[0.18] font-medium text-muted-foreground">
                                    <th className="h-11 px-4 text-left text-xs font-bold tracking-wider uppercase">
                                        ID
                                    </th>
                                    <th className="h-11 px-4 text-left text-xs font-bold tracking-wider uppercase">
                                        Segurado
                                    </th>
                                    <th className="h-11 px-4 text-left text-xs font-bold tracking-wider uppercase">
                                        Número da Apólice
                                    </th>
                                    <th className="h-11 px-4 text-left text-xs font-bold tracking-wider uppercase">
                                        Ramo / Seguradora
                                    </th>
                                    <th className="h-11 px-4 text-left text-xs font-bold tracking-wider uppercase">
                                        Valor do Prêmio
                                    </th>
                                    <th className="h-11 px-4 text-left text-xs font-bold tracking-wider uppercase">
                                        Parcelas
                                    </th>
                                    <th className="h-11 px-4 text-left text-xs font-bold tracking-wider uppercase">
                                        Vigência
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
                                {apolicesFiltradas.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={8}
                                            className="h-24 px-4 text-center text-muted-foreground"
                                        >
                                            Nenhuma apólice encontrada.
                                        </td>
                                    </tr>
                                ) : (
                                    apolicesFiltradas.map((apolice: any) => (
                                        <tr
                                            key={apolice.id}
                                            className="border-b border-border/70 transition-colors hover:bg-muted/[0.12]"
                                        >
                                            <td className="px-4 py-3.5 font-mono text-xs text-muted-foreground">
                                                #
                                                {String(apolice.id).padStart(
                                                    4,
                                                    '0',
                                                )}
                                            </td>
                                            <td className="px-4 py-3.5 font-medium text-foreground">
                                                {apolice.nome_completo}
                                            </td>
                                            <td className="px-4 py-3.5 text-muted-foreground">
                                                {apolice.numero_apolice}
                                            </td>
                                            <td className="px-4 py-3.5 text-muted-foreground">
                                                {apolice.nome_ramo} /{' '}
                                                {apolice.nome_fantasia}
                                            </td>
                                            <td className="px-4 py-3.5 text-muted-foreground">
                                                R$ {apolice.valor_premio_total}
                                            </td>
                                            <td className="px-4 py-3.5 text-muted-foreground">
                                                {apolice.quantidade_parcelas}
                                            </td>
                                            <td className="px-4 py-3.5 text-muted-foreground">
                                                {formatarDataBR(
                                                    apolice.inicio_vigencia,
                                                )}{' '}
                                                -{' '}
                                                {formatarDataBR(
                                                    apolice.fim_vigencia,
                                                )}
                                            </td>
                                            <td className="px-4 py-3.5">
                                                <span
                                                    className={`inline-flex rounded-lg px-2.5 py-1 text-xs font-semibold capitalize ${getStatusBadgeStyle(
                                                        apolice.status_vigencia,
                                                    )}`}
                                                >
                                                    {apolice.status_vigencia}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3.5 text-right">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() =>
                                                        abrirPerfil(apolice)
                                                    }
                                                    className="h-8 w-8 rounded-xl border-border/70 p-0 hover:border-emerald-500/40"
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
                                    1
                                </span>{' '}
                                de{' '}
                                <span className="font-medium text-foreground">
                                    1
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

            {/* Modais da Aplicação */}
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
