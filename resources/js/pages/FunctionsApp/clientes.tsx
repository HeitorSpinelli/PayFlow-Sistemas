import { useState } from 'react';
import { Head, Link } from '@inertiajs/react'; // Adicionado Link para a paginação
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
    X,
} from 'lucide-react';

import CreateSeguradoModal from '@/components/modals/create-segurado-modal';
import { Button } from '@/components/ui/button';
import SeguradoProfileModal from '@/components/modals/create-profile-modal';
import { apolices, pagamentos } from '@/routes';
import { Input } from '@/components/ui/input';

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
    segurados: PaginatedSegurados;
    total: number;
    totalInativos: number;
}

export default function Clientes({
    segurados,
    total,
    totalInativos,
}: PageProps) {
    const [openModal, setOpenModal] = useState(false);
    const [openProfile, setOpenProfile] = useState(false);
    const [seguradoSelecionado, setSeguradoSelecionado] = useState<any>(null);
    const [filtroAberto, setFiltroAberto] = useState(false);
    const [filtroSelecionado, setFiltroSelecionado] = useState('Todos');
    const opcoesFiltro = ['Todos', 'Ativos', 'Inativos'];
    const [seguradoPesquisado, setSeguradoPesquisado] = useState('');
    const [exportarAberto, setExportarAberto] = useState(false);

    // 1. Extrai a lista real de segurados
    const listaDeSegurados =
        segurados?.data ?? (Array.isArray(segurados) ? segurados : []);

    // 2. Filtra por status
    const seguradosFiltrados = listaDeSegurados.filter((segurado: any) => {
        if (filtroSelecionado === 'Todos') return true;
        if (filtroSelecionado === 'Ativos') return segurado.status === 'Ativo';
        if (filtroSelecionado === 'Inativos')
            return segurado.status === 'Inativo';
        return true;
    });

    // 3. Filtra por pesquisa (Nome ou CPF/CNPJ)
    const seguradosFiltradosComPesquisa = seguradosFiltrados.filter(
        (segurado: any) => {
            const termoPesquisa = seguradoPesquisado.toLowerCase();
            return (
                segurado.nome_completo?.toLowerCase().includes(termoPesquisa) ||
                segurado.cpf_cnpj?.toLowerCase().includes(termoPesquisa)
            );
        },
    );

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
                        <h1 className="text-2xl font-bold tracking-tight">
                            Clientes
                        </h1>
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
                <div className="flex justify-center gap-4">
                    <div className="flex flex-1 items-start justify-between rounded-xl border border-sidebar-border/70 bg-card p-6 shadow-sm">
                        <div className="flex flex-col gap-1">
                            <h2 className="text-sm font-medium text-muted-foreground">
                                Total de Clientes
                            </h2>
                            <p className="text-3xl font-bold tracking-tight text-green-500">
                                {total}
                            </p>
                        </div>
                        <UserRound className="size-10 text-muted-foreground/50" />
                    </div>
                    <div className="flex flex-1 items-start justify-between rounded-xl border border-sidebar-border/70 bg-card p-6 shadow-sm">
                        <div className="flex flex-col gap-1">
                            <h2 className="text-sm font-medium text-muted-foreground">
                                Clientes Ativos
                            </h2>
                            <p className="text-3xl font-bold tracking-tight text-green-500">
                                {
                                    seguradosFiltrados.filter(
                                        (segurado: any) =>
                                            segurado.status === 'Ativo',
                                    ).length
                                }
                            </p>
                        </div>
                        <ScrollText className="size-10 text-muted-foreground/50" />
                    </div>

                    <div className="flex flex-1 items-start justify-between rounded-xl border border-sidebar-border/70 bg-card p-6 shadow-sm">
                        <div className="flex flex-col gap-1">
                            <h2 className="text-sm font-medium text-muted-foreground">
                                Inativos
                            </h2>
                            <p className="text-3xl font-bold tracking-tight text-red-500">
                                {totalInativos}
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
                                Lista de Clientes
                            </h3>
                            <p className="text-xs text-muted-foreground">
                                {total} cliente(s) encontrado(s)
                            </p>
                        </div>

                        <div className="flex items-center gap-2">
                            <div className="relative">
                                <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    placeholder="Buscar por nome, CPF..."
                                    className="h-9 w-64 rounded-md border border-sidebar-border bg-background pr-3 pl-9 text-sm focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
                                    value={seguradoPesquisado}
                                    onChange={(e) =>
                                        setSeguradoPesquisado(e.target.value)
                                    }
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
                                    className="inline-flex h-9 min-w-[110px] items-center justify-center gap-2 rounded-md border border-sidebar-border bg-background px-3 text-sm font-medium transition-colors hover:bg-muted"
                                >
                                    <Filter className="size-4 text-muted-foreground" />
                                    {filtroSelecionado}
                                    <ChevronDown
                                        className={`size-4 text-muted-foreground transition-transform ${filtroAberto ? 'rotate-180' : ''}`}
                                    />
                                </button>

                                {filtroAberto && (
                                    <div className="absolute right-0 z-50 mt-2 w-40 overflow-hidden rounded-lg border border-sidebar-border bg-background py-1 shadow-lg">
                                        {opcoesFiltro.map((opcao) => (
                                            <button
                                                key={opcao}
                                                onClick={() => {
                                                    setFiltroSelecionado(opcao);
                                                    setFiltroAberto(false);
                                                }}
                                                className={`flex w-full items-center justify-between px-3 py-2 text-sm transition-colors ${
                                                    filtroSelecionado === opcao
                                                        ? // Opção ativa: fundo verde escuro com texto branco
                                                          'bg-[#2D5A43] text-white'
                                                        : 'text-foreground hover:bg-muted'
                                                }`}
                                            >
                                                {opcao}
                                                {/* Checkmark visível apenas na opção selecionada */}
                                                {filtroSelecionado ===
                                                    opcao && (
                                                    <Check className="size-4" />
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <button className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-sidebar-border bg-background px-3 text-sm font-medium transition-colors hover:bg-muted">
                                <Download className="size-4 text-muted-foreground" />
                                Exportar
                            </button>
                        </div>
                    </div>

                    {/* Tabela de segurados */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-sidebar-border bg-muted/30 font-medium text-muted-foreground">
                                    <th className="h-12 px-4 text-left">ID</th>
                                    <th className="h-12 px-4 text-left">
                                        Cliente
                                    </th>
                                    <th className="h-12 px-4 text-left">
                                        CPF/CNPJ
                                    </th>
                                    <th className="h-12 px-4 text-left">
                                        Telefone
                                    </th>
                                    <th className="h-12 px-4 text-left">
                                        Localização
                                    </th>
                                    <th className="h-12 px-4 text-left">
                                        Status
                                    </th>
                                    <th className="h-12 px-4 text-left">
                                        Ações
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {segurados === null ||
                                seguradosFiltradosComPesquisa.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={7}
                                            className="h-12 px-4 text-center text-muted-foreground"
                                        >
                                            Nenhum cliente encontrado.
                                        </td>
                                    </tr>
                                ) : (
                                    seguradosFiltradosComPesquisa.map(
                                        (segurado: any) => (
                                            <tr
                                                key={segurado.id}
                                                className="border-b border-sidebar-border transition-colors hover:bg-muted/30"
                                            >
                                                <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                                                    #
                                                    {String(
                                                        segurado.id,
                                                    ).padStart(4, '0')}
                                                </td>
                                                <td className="h-12 px-4">
                                                    {segurado.nome_completo}
                                                </td>
                                                <td className="h-12 px-4">
                                                    {segurado.cpf_cnpj}
                                                </td>
                                                <td className="h-12 px-4">
                                                    {segurado.telefone_fixo}
                                                </td>
                                                <td className="h-12 px-4">
                                                    {segurado.cidade} -{' '}
                                                    {segurado.estado}
                                                </td>
                                                <td className="h-12 px-4">
                                                    <span
                                                        className={`inline-flex rounded-md px-2.5 py-0.5 text-xs font-medium capitalize ${
                                                            segurado.status ===
                                                            'Ativo'
                                                                ? 'bg-green-50 text-green-600'
                                                                : 'bg-orange-50 text-orange-600'
                                                        }`}
                                                    >
                                                        {segurado.status}
                                                    </span>
                                                </td>
                                                <td className="h-12 px-4">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="rounded-lg"
                                                        onClick={() =>
                                                            abrirPerfil(
                                                                segurado,
                                                            )
                                                        } // ← abre o perfil, não o de criar
                                                    >
                                                        <MoreHorizontal className="size-4" />
                                                    </Button>
                                                </td>
                                            </tr>
                                        ),
                                    )
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* 4. Paginação */}
                    <div className="flex items-center justify-between border-t border-sidebar-border bg-muted/10 px-4 py-4">
                        <div className="text-sm text-muted-foreground">
                            Mostrando{' '}
                            <span className="font-medium text-foreground">
                                {segurados?.from ?? 0}
                            </span>{' '}
                            até{' '}
                            <span className="font-medium text-foreground">
                                {segurados?.to ?? 0}
                            </span>{' '}
                            de{' '}
                            <span className="font-medium text-foreground">
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
                                    className="inline-flex h-8 items-center justify-center gap-1 rounded-md border border-sidebar-border bg-background px-3 text-xs font-medium transition-colors hover:bg-muted"
                                >
                                    <ChevronLeft className="size-3" />
                                    Anterior
                                </Link>
                            ) : (
                                <button
                                    disabled
                                    className="inline-flex h-8 items-center justify-center gap-1 rounded-md border border-sidebar-border bg-background px-3 text-xs font-medium transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    <ChevronLeft className="size-3" />
                                    Anterior
                                </button>
                            )}

                            {/* Botão Próxima */}
                            {segurados?.next_page_url ? (
                                <Link
                                    href={segurados.next_page_url}
                                    preserveScroll
                                    
                                    className="inline-flex h-8 items-center justify-center gap-1 rounded-md border border-sidebar-border bg-background px-3 text-xs font-medium transition-colors hover:bg-muted"
                                >
                                    Próxima
                                    <ChevronRight className="size-3" />
                                </Link>
                            ) : (
                                <button
                                    disabled
                                    className="inline-flex h-8 items-center justify-center gap-1 rounded-md border border-sidebar-border bg-background px-3 text-xs font-medium transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    Próxima
                                    <ChevronRight className="size-3" />
                                </button>
                            )}
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
    );
}
