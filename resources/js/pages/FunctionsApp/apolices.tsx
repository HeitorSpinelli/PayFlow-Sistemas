import { useState, useRef } from 'react';
import { Head, Link, router } from '@inertiajs/react';
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
    apolices?: PaginatedApolices;
    total?: number;
    totalAtivas?: number;
    totalInativas?: number;
}

import { formatarMoeda } from '@/utils/Masks';

/**
 * Tela "Apólices" — URL /apolices.
 * Props entregues por ApolicesController::index(): `apolices` (paginado,
 * filtrado por ?busca e ?status via ApoliceService::buscarApolices()),
 * listas de segurados/seguradoras/ramos para os selects do modal de criação
 * e os totais dos cards.
 *
 * Seções, de cima para baixo:
 * 1. Cabeçalho com o botão "Nova Apólice" (CreateApoliceModal → POST /apolices);
 * 2. Cards: Total de Apólices, Ativas (vigência cobre hoje), Inativas;
 * 3. Tabela (busca, filtro de status de vigência, Exportar CSV) — o botão
 *    "..." de cada linha abre o perfil da apólice (CreateApoliceProfileModal:
 *    editar, alterar ramo, ativar, renovar, cancelar, restaurar);
 * 4. Paginação.
 */
export default function Apolices({
    segurados,
    seguradoras,
    ramos,
    apolices,
    total = 0,
    totalAtivas = 0,
    totalInativas = 0,
}: PageProps) {
    const [openModal, setOpenModal] = useState(false); // modal de criar
    const [openApoliceProfile, setOpenApoliceProfile] = useState(false); // modal de perfil da apólice
    const [apoliceSelecionada, setApoliceSelecionada] = useState<any>(null); // apólice selecionada para o perfil
    const [filtroAberto, setFiltroAberto] = useState(false); // dropdown do filtro de status
    // Opções do filtro — mesmos textos de Apolice::getStatusVigenciaAttribute();
    // 'Todas' remove o ?status da URL.
    const opcoesFiltro = ['Todas', 'Vigente', 'A Iniciar', 'Para Renovar'];

    // Cor do selo da coluna "Status" da tabela conforme o status de vigência.
    const getStatusBadgeStyle = (status: string) => {
        switch (status) {
            case 'Vigente':
                return 'bg-emerald-500/10 text-emerald-500';
            case 'Para Renovar':
                return 'bg-rose-500/10 text-rose-500';
            case 'A Iniciar':
                return 'bg-amber-500/10 text-amber-500';
            default:
                return 'bg-rose-500/10 text-rose-500';
        }
    };

    // Botão "..." da linha: guarda a apólice e abre o modal de perfil.
    const abrirPerfil = (apolice: any) => {
        setApoliceSelecionada(apolice);
        setOpenApoliceProfile(true);
    };

    // Cópia local do formatarDataBR de utils/Masks (mesmo comportamento),
    // usada nas colunas de vigência da tabela.
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

    // Texto do campo de busca e opção marcada no filtro, iniciados pela URL
    // (assim um F5 mantém a tela filtrada).
    const [busca, setBusca] = useState(urlParams.get('busca') || '');
    const [filtroSelecionado, setFiltroSelecionado] = useState(
        urlParams.get('status') || 'Todas',
    );

    // Ref para controlar o debounce da busca
    const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Função de busca acionada ao digitar com debounce (dispara a busca no Back-end via Inertia)
    // GET /apolices?busca=... → recarrega só a tabela, voltando à página 1.
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
    // GET /apolices?status=... e fecha o dropdown.
    const handleFiltroChange = (opcao: string) => {
        setFiltroSelecionado(opcao);
        setFiltroAberto(false);

        const params = new URLSearchParams(window.location.search);

        if (opcao !== 'Todas') {
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
    const apolicesFiltradas = apolices?.data || [];

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

                {/* 2. Cards de Estatísticas — flat, sem glow/blur, só borda e cor */}
                {/* No celular os 3 cards ficam lado a lado, compactos e sem
                    ícone; a partir de sm voltam ao layout original. */}
                <div className="grid grid-cols-3 gap-2.5 sm:gap-4">
                    <div className="flex items-stretch justify-between rounded-2xl border border-border/70 bg-card p-3 transition-colors hover:border-emerald-500/30 sm:items-center sm:p-5">
                        <div className="flex flex-col justify-between gap-1 sm:justify-start">
                            <span className="text-[11px] font-medium text-muted-foreground sm:text-xs">
                                Total de Clientes
                            </span>
                            <span className="text-xl font-semibold tracking-tight text-foreground sm:text-3xl">
                                {total}
                            </span>
                        </div>
                        <div className="hidden h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 sm:flex">
                            <UserRound className="size-5" />
                        </div>
                    </div>
                    <div className="flex items-stretch justify-between rounded-2xl border border-border/70 bg-card p-3 transition-colors hover:border-emerald-500/30 sm:items-center sm:p-5">
                        <div className="flex flex-col justify-between gap-1 sm:justify-start">
                            <span className="text-[11px] font-medium text-muted-foreground sm:text-xs">
                                Clientes Ativos
                            </span>
                            <span className="text-xl font-semibold tracking-tight text-emerald-600 sm:text-3xl">
                                {totalAtivas}
                            </span>
                        </div>
                        <div className="hidden h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 sm:flex">
                            <ScrollText className="size-5" />
                        </div>
                    </div>
                    <div className="flex items-stretch justify-between rounded-2xl border border-border/70 bg-card p-3 transition-colors hover:border-rose-500/30 sm:items-center sm:p-5">
                        <div className="flex flex-col justify-between gap-1 sm:justify-start">
                            <span className="text-[11px] font-medium text-muted-foreground sm:text-xs">
                                Inativos
                            </span>
                            <span className="text-xl font-semibold tracking-tight text-rose-500 sm:text-3xl">
                                {totalInativas}
                            </span>
                        </div>
                        <div className="hidden h-11 w-11 items-center justify-center rounded-xl bg-rose-500/10 text-rose-500 sm:flex">
                            <ScrollText className="size-5" />
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
                                {apolices?.total ?? 0} apólice(s) encontrada(s)
                            </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2.5">
                            <div className="relative w-full sm:w-auto">
                                <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground/60" />
                                <Input
                                    placeholder="Buscar por apólice, cliente, CPF..."
                                    className="h-10 w-full rounded-xl border border-border/70 bg-background pr-3 pl-9 text-sm shadow-sm transition-all placeholder:text-muted-foreground/55 hover:border-emerald-500/40 focus-visible:ring-4 focus-visible:ring-emerald-500/10 focus-visible:outline-none sm:w-64"
                                    value={busca}
                                    onChange={handleBuscaChange}
                                />
                            </div>

                            {/* Dropdown de filtro por status */}
                            <div className="relative flex-1 sm:flex-initial">
                                <button
                                    onClick={() =>
                                        setFiltroAberto(!filtroAberto)
                                    }
                                    className="inline-flex h-10 w-full min-w-[120px] items-center justify-between gap-2 rounded-xl border border-border/70 bg-background px-3 text-sm font-medium shadow-sm transition-all hover:border-emerald-500/40 hover:bg-muted/50 focus:ring-4 focus:ring-emerald-500/10 focus:outline-none sm:w-auto"
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
                                className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-xl border border-border/70 bg-background px-4 text-sm font-medium shadow-sm transition-all hover:border-emerald-500/40 hover:bg-muted/50 focus:ring-4 focus:ring-emerald-500/10 focus:outline-none sm:flex-initial"
                            >
                                <Download className="size-4 text-muted-foreground/60" />
                                Exportar
                            </a>
                        </div>
                    </div>

                    {/* Tabela de Apólices */}
                    <div className="overflow-x-auto">
                        {/* Celular/tablet: uma apólice por card, com as
                            mesmas informações e o mesmo botão de perfil da
                            tabela (que só aparece a partir de lg). */}
                        <div className="divide-y divide-border/70 lg:hidden">
                            {apolicesFiltradas.length === 0 ? (
                                <p className="px-4 py-10 text-center text-sm text-muted-foreground">
                                    Nenhuma apólice encontrada.
                                </p>
                            ) : (
                                apolicesFiltradas.map((apolice: any) => (
                                    <div
                                        key={apolice.id}
                                        className="flex flex-col gap-3 px-4 py-4"
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <p className="truncate font-semibold text-foreground">
                                                    {apolice.nome_completo}
                                                </p>
                                                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                                                    <span className="font-mono">
                                                        #
                                                        {String(
                                                            apolice.id,
                                                        ).padStart(4, '0')}
                                                    </span>{' '}
                                                    · {apolice.numero_apolice}
                                                </p>
                                            </div>
                                            <div className="flex shrink-0 items-center gap-2">
                                                <span
                                                    className={`inline-flex rounded-lg px-2.5 py-1 text-xs font-semibold capitalize ${getStatusBadgeStyle(
                                                        apolice.status_vigencia,
                                                    )}`}
                                                >
                                                    {apolice.status_vigencia}
                                                </span>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    aria-label="Abrir perfil da apólice"
                                                    onClick={() =>
                                                        abrirPerfil(apolice)
                                                    }
                                                    className="h-10 w-10 rounded-xl border-border/70 p-0 hover:border-emerald-500/40"
                                                >
                                                    <MoreHorizontal className="size-4" />
                                                </Button>
                                            </div>
                                        </div>
                                        <p className="text-sm text-muted-foreground">
                                            {apolice.nome_ramo} /{' '}
                                            {apolice.nome_fantasia}
                                        </p>
                                        <dl className="grid grid-cols-3 gap-2 rounded-xl bg-muted/40 p-3 text-xs">
                                            <div className="min-w-0">
                                                <dt className="text-muted-foreground">
                                                    Prêmio
                                                </dt>
                                                <dd className="mt-0.5 truncate font-semibold text-foreground">
                                                    {formatarMoeda(
                                                        apolice.valor_premio_total,
                                                    )}
                                                </dd>
                                            </div>
                                            <div className="min-w-0">
                                                <dt className="text-muted-foreground">
                                                    Parcelas
                                                </dt>
                                                <dd className="mt-0.5 font-semibold text-foreground">
                                                    {
                                                        apolice.quantidade_parcelas
                                                    }
                                                </dd>
                                            </div>
                                            <div className="min-w-0">
                                                <dt className="text-muted-foreground">
                                                    Vigência
                                                </dt>
                                                <dd className="mt-0.5 leading-tight font-semibold text-foreground">
                                                    {formatarDataBR(
                                                        apolice.inicio_vigencia,
                                                    )}
                                                    <br />
                                                    {formatarDataBR(
                                                        apolice.fim_vigencia,
                                                    )}
                                                </dd>
                                            </div>
                                        </dl>
                                    </div>
                                ))
                            )}
                        </div>

                        <table className="hidden w-full text-sm lg:table">
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
                                            colSpan={9}
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
                                                {formatarMoeda(
                                                    apolice.valor_premio_total,
                                                )}
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
                        <div className="flex flex-col gap-3 border-t border-border/70 bg-muted/[0.18] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-0 sm:px-5">
                            <div className="text-center text-sm text-muted-foreground sm:text-left">
                                Mostrando{' '}
                                <span className="font-medium text-foreground">
                                    {apolices?.from ?? 0}
                                </span>{' '}
                                até{' '}
                                <span className="font-medium text-foreground">
                                    {apolices?.to ?? 0}
                                </span>{' '}
                                de{' '}
                                <span className="font-medium text-foreground">
                                    {apolices?.total ?? 0}
                                </span>{' '}
                                resultados
                            </div>
                            <div className="flex w-full items-center gap-2 sm:w-auto">
                                {apolices?.prev_page_url ? (
                                    <Link
                                        href={apolices.prev_page_url}
                                        preserveScroll
                                        className="inline-flex h-10 flex-1 items-center justify-center gap-1 rounded-xl border border-border/70 bg-background px-3 text-xs font-medium shadow-sm transition-all hover:border-emerald-500/40 hover:bg-muted sm:h-9 sm:flex-initial"
                                    >
                                        <ChevronLeft className="size-3" />
                                        Anterior
                                    </Link>
                                ) : (
                                    <button
                                        disabled
                                        className="inline-flex h-10 flex-1 items-center justify-center gap-1 rounded-xl border border-border/70 bg-background px-3 text-xs font-medium shadow-sm transition-all disabled:cursor-not-allowed disabled:opacity-50 sm:h-9 sm:flex-initial"
                                    >
                                        <ChevronLeft className="size-3" />
                                        Anterior
                                    </button>
                                )}
                                {apolices?.next_page_url ? (
                                    <Link
                                        href={apolices.next_page_url}
                                        preserveScroll
                                        className="inline-flex h-10 flex-1 items-center justify-center gap-1 rounded-xl border border-border/70 bg-background px-3 text-xs font-medium shadow-sm transition-all hover:border-emerald-500/40 hover:bg-muted sm:h-9 sm:flex-initial"
                                    >
                                        Próxima
                                        <ChevronRight className="size-3" />
                                    </Link>
                                ) : (
                                    <button
                                        disabled
                                        className="inline-flex h-10 flex-1 items-center justify-center gap-1 rounded-xl border border-border/70 bg-background px-3 text-xs font-medium shadow-sm transition-all disabled:cursor-not-allowed disabled:opacity-50 sm:h-9 sm:flex-initial"
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

            {/* Modais da Aplicação */}
            {/* Criação (key={openModal} recria o modal a cada abertura, zerando o formulário) */}
            <CreateApoliceModal
                open={openModal}
                key={openModal}
                setOpen={setOpenModal}
                segurados={segurados}
                seguradoras={seguradoras}
                ramos={ramos}
                apolices={apolices}
            />
            {/* Perfil da apólice clicada na tabela */}
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
