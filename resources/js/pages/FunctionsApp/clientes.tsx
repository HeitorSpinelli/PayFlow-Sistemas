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

import CreateSeguradoModal from '@/components/modals/create-segurado-modal';
import { formataCpfCnpj } from '@/utils/cpfMask';
import { Button } from '@/components/ui/button';
import SeguradoProfileModal from '@/components/modals/create-profile-modal';
import { Input } from '@/components/ui/input';
import { formataInputBusca } from '@/utils/Searchformatter';

// Interface para o objeto de paginação do Laravel
interface PaginatedSegurados {
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
    segurados?: PaginatedSegurados;
    total?: number;
    totalAtivos?: number;
    totalInativos?: number;
}

export default function Clientes({
    segurados,
    total = 0,
    totalInativos = 0,
    totalAtivos = 0,
}: PageProps) {
    const [openModal, setOpenModal] = useState(false);
    const [openProfile, setOpenProfile] = useState(false);
    const [filtroAberto, setFiltroAberto] = useState(false);
    const [exportarAberto, setExportarAberto] = useState(false);
    const [seguradoSelecionado, setSeguradoSelecionado] = useState<any>(null);

    const opcoesFiltro = ['Todos', 'Ativos', 'Inativos'];

    // Lê os parâmetros atuais da URL para inicializar os estados corretamente
    const urlParams =
        typeof window !== 'undefined'
            ? new URLSearchParams(window.location.search)
            : new URLSearchParams();

    const [seguradoPesquisado, setSeguradoPesquisado] = useState(
        urlParams.get('busca') || '',
    );
    const [filtroSelecionado, setFiltroSelecionado] = useState(
        urlParams.get('status') || 'Todos',
    );

    // Ref para controlar o debounce da busca
    const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Função de busca acionada ao digitar (com debounce de 500ms)
    const handleBuscaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const valor = e.target.value;
        setSeguradoPesquisado(valor);

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
            params.delete('page'); // Reseta para a página 1 ao realizar uma nova busca

            // Dispara a busca no Back-end via Inertia
            router.get(
                window.location.pathname,
                Object.fromEntries(params.entries()),
                {
                    preserveState: true, // Mantém os modais/inputs abertos
                    preserveScroll: true, // Mantém a rolagem da tela
                    replace: true, // Substitui no histórico do navegador
                },
            );
        });
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

        // Dispara o filtro no Back-end via Inertia (Sem debounce)
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

    const abrirPerfil = (segurado: any) => {
        setSeguradoSelecionado(segurado);
        setOpenProfile(true);
    };

    // Tratamentos seguros para evitar NaN
    const totalGeral = total ?? 0;
    const totalInativosSegurados = totalInativos ?? 0;
    const totalAtivosSegurados = totalAtivos ?? 0;

    return (
        <>
            <Head title="Clientes" />

            <div className="flex flex-col gap-6 p-6 sm:p-8">
                {/* 1. Header da Página */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <div className="mb-1 flex items-center gap-1.5 text-[10px] font-bold tracking-[0.16em] text-emerald-600 uppercase">
                            <span>Gestão</span>
                            <ChevronRight className="h-3 w-3" />
                            <span>Clientes</span>
                        </div>
                        <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
                            Clientes
                        </h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Gerencie os clientes e segurados cadastrados
                        </p>
                    </div>
                    <Button
                        onClick={() => setOpenModal(true)}
                        className="h-11 rounded-xl bg-emerald-500 px-5 font-bold text-white shadow-lg shadow-emerald-500/20 transition-all hover:bg-emerald-600 active:scale-[0.98]"
                    >
                        <Plus className="mr-2 size-4" />
                        Novo Cliente
                    </Button>
                </div>

                {/* 2. Cards de Estatísticas com Glow / Efeito de Luz */}
                <div className="grid gap-4 sm:grid-cols-3">
                    <div className="relative flex items-center justify-between overflow-hidden rounded-2xl border border-border/70 bg-card p-5 shadow-sm transition-all duration-300 hover:scale-[1.02] hover:border-emerald-500/30">
                        <div className="pointer-events-none absolute -top-10 -right-10 h-32 w-32 rounded-full bg-emerald-500/10 blur-3xl"></div>
                        <div className="relative z-10 flex flex-col gap-1">
                            <span className="text-xs font-medium text-muted-foreground">
                                Total de Clientes
                            </span>
                            <span className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                                {totalGeral}
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
                                Clientes Ativos
                            </span>
                            <span className="text-2xl font-bold tracking-tight text-emerald-500 sm:text-3xl">
                                {totalAtivosSegurados}
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
                                Inativos
                            </span>
                            <span className="text-2xl font-bold tracking-tight text-rose-500 sm:text-3xl">
                                {totalInativosSegurados}
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
                                Lista de Clientes
                            </h3>
                            <p className="text-xs text-muted-foreground">
                                {segurados?.total ?? 0} cliente(s) encontrado(s)
                            </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2.5">
                            <div className="relative">
                                <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground/60" />
                                <Input
                                    placeholder="Buscar por nome, CPF..."
                                    className="h-10 w-full rounded-xl border border-border/70 bg-background pr-3 pl-9 text-sm shadow-sm transition-all placeholder:text-muted-foreground/55 hover:border-emerald-500/40 focus-visible:ring-4 focus-visible:ring-emerald-500/10 focus-visible:outline-none sm:w-64"
                                    value={formataInputBusca(
                                        seguradoPesquisado,
                                    )}
                                    onChange={handleBuscaChange}
                                />
                            </div>

                            {/* Dropdown de filtro por status */}
                            <div className="relative">
                                <button
                                    onClick={() => {
                                        setFiltroAberto(!filtroAberto);
                                        setExportarAberto(false);
                                    }}
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
                                    /* Altere de 'right-0' para 'left-0' ou adicione max-w e posicionamento seguro */
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
                                href="/segurados/exportar"
                                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-border/70 bg-background px-4 text-sm font-medium shadow-sm transition-all hover:border-emerald-500/40 hover:bg-muted/50 focus:ring-4 focus:ring-emerald-500/10 focus:outline-none"
                            >
                                <Download className="size-4 text-muted-foreground/60" />
                                Exportar
                            </a>
                        </div>
                    </div>

                    {/* Tabela de segurados */}
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
                                        CPF/CNPJ
                                    </th>
                                    <th className="h-11 px-4 text-left text-xs font-bold tracking-wider uppercase">
                                        Telefone/Celular
                                    </th>
                                    <th className="h-11 px-4 text-left text-xs font-bold tracking-wider uppercase">
                                        Localização
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
                                {!segurados?.data ||
                                segurados.data.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={7}
                                            className="h-24 px-4 text-center text-muted-foreground"
                                        >
                                            Nenhum cliente encontrado.
                                        </td>
                                    </tr>
                                ) : (
                                    segurados?.data?.map((segurado) => (
                                        <tr
                                            key={segurado.id}
                                            className="border-b border-border/70 transition-colors hover:bg-muted/[0.12]"
                                        >
                                            <td className="px-4 py-3.5 font-mono text-xs text-muted-foreground">
                                                #
                                                {String(segurado.id).padStart(
                                                    4,
                                                    '0',
                                                )}
                                            </td>
                                            <td className="px-4 py-3.5 font-medium text-foreground">
                                                {segurado.nome_completo}
                                            </td>
                                            <td className="px-4 py-3.5 text-muted-foreground">
                                                {segurado.cpf_cnpj
                                                    ? formataCpfCnpj(
                                                          segurado.cpf_cnpj,
                                                      )
                                                    : '-'}
                                            </td>
                                            <td className="px-4 py-3.5 text-muted-foreground">
                                                {segurado.celular_whatsapp ||
                                                    segurado.telefone ||
                                                    '-'}
                                            </td>
                                            <td className="px-4 py-3.5 text-muted-foreground">
                                                {segurado.cidade} -{' '}
                                                {segurado.estado}
                                            </td>
                                            <td className="px-4 py-3.5">
                                                <span
                                                    className={`inline-flex rounded-lg px-2.5 py-1 text-xs font-semibold capitalize ${
                                                        segurado.status ===
                                                        'Ativo'
                                                            ? 'bg-emerald-500/10 text-emerald-500'
                                                            : 'bg-rose-500/10 text-rose-500'
                                                    }`}
                                                >
                                                    {segurado.status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3.5 text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 w-8 rounded-lg p-0 hover:bg-emerald-500/10 hover:text-emerald-500"
                                                    onClick={() =>
                                                        abrirPerfil(segurado)
                                                    }
                                                >
                                                    <MoreHorizontal className="size-4" />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* 4. Paginação */}
                    <div className="flex flex-col gap-4 border-t border-border/70 bg-muted/[0.08] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                        <div className="text-xs text-muted-foreground">
                            Mostrando{' '}
                            <span className="font-semibold text-foreground">
                                {segurados?.from ?? 0}
                            </span>{' '}
                            até{' '}
                            <span className="font-semibold text-foreground">
                                {segurados?.to ?? 0}
                            </span>{' '}
                            de{' '}
                            <span className="font-semibold text-foreground">
                                {segurados?.total ?? 0}
                            </span>{' '}
                            resultados
                        </div>

                        <div className="flex items-center gap-2">
                            {/* Botão Anterior */}
                            {segurados?.prev_page_url ? (
                                <Link
                                    href={segurados.prev_page_url}
                                    preserveScroll
                                    className="inline-flex h-9 items-center justify-center gap-1 rounded-xl border border-border/70 bg-background px-3.5 text-xs font-medium shadow-sm transition-all hover:border-emerald-500/40 hover:bg-muted/50"
                                >
                                    <ChevronLeft className="size-3.5" />
                                    Anterior
                                </Link>
                            ) : (
                                <button
                                    disabled
                                    className="inline-flex h-9 items-center justify-center gap-1 rounded-xl border border-border/70 bg-background px-3.5 text-xs font-medium shadow-sm transition-all disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                    <ChevronLeft className="size-3.5" />
                                    Anterior
                                </button>
                            )}

                            {/* Botão Próxima */}
                            {segurados?.next_page_url ? (
                                <Link
                                    href={segurados.next_page_url}
                                    preserveScroll
                                    className="inline-flex h-9 items-center justify-center gap-1 rounded-xl border border-border/70 bg-background px-3.5 text-xs font-medium shadow-sm transition-all hover:border-emerald-500/40 hover:bg-muted/50"
                                >
                                    Próxima
                                    <ChevronRight className="size-3.5" />
                                </Link>
                            ) : (
                                <button
                                    disabled
                                    className="inline-flex h-9 items-center justify-center gap-1 rounded-xl border border-border/70 bg-background px-3.5 text-xs font-medium shadow-sm transition-all disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                    Próxima
                                    <ChevronRight className="size-3.5" />
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal de criar cliente */}
            <CreateSeguradoModal open={openModal} setOpen={setOpenModal} />

            {/* seguradoSelecionado diferente de null abre o modal de perfil para cada um */}
            {seguradoSelecionado && (
                <SeguradoProfileModal open={openProfile} setOpen={setOpenProfile} segurado={seguradoSelecionado} />
            )}
        </>
    );
}
