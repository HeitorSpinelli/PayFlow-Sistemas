import { Head, Link, router } from '@inertiajs/react';
import {
    AlertTriangle,
    Plus,
    Printer,
    ScrollText,
    Search,
    Trash2,
    Download,
    Filter,
    Check,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    UserRound,
} from 'lucide-react';
import { useState, useRef } from 'react';
import { toast } from 'sonner';
import PainelCliente from '@/components/clientes/painel-cliente';
import CreateSeguradoModal from '@/components/modals/create-segurado-modal';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

import { formataCpfCnpj, removeMask, formataInputBusca } from '@/utils/Masks';

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

/**
 * Tela "Clientes" — URL /clientes.
 * Props entregues por SeguradoController::show(): `segurados` (paginado de
 * 10 em 10, já filtrado por ?busca e ?status) e os totais dos cards.
 *
 * Seções, de cima para baixo:
 * 1. Cabeçalho com o botão "Novo Cliente" (abre CreateSeguradoModal → POST /clientes);
 * 2. Cards: Total de Clientes, Clientes Ativos, Inativos;
 * 3. Lista de clientes (busca, filtro de status, Exportar CSV, tabela com
 *    ações de imprimir ficha e excluir) + painel do cliente selecionado à
 *    direita (PainelCliente: dados, edição via PUT /clientes/{id} e apólices);
 * 4. Paginação;
 * 5. Modais: criar cliente e confirmar exclusão (DELETE /clientes/{id}).
 */
export default function Clientes({
    segurados,
    total = 0,
    totalInativos = 0,
    totalAtivos = 0,
}: PageProps) {
    // Abre/fecha o modal "Novo Cliente".
    const [openModal, setOpenModal] = useState(false);
    // Abre/fecha o dropdown do filtro de status (Todos/Ativos/Inativos).
    const [filtroAberto, setFiltroAberto] = useState(false);

    // Estado para controlar o segurado selecionado e o segurado a ser excluído
    const [seguradoSelecionadoId, setSeguradoSelecionadoId] = useState<
        number | null
    >(null);
    const [seguradoParaExcluir, setSeguradoParaExcluir] = useState<any>(null);

    //find() retorna o primeiro elemento que satisfaz a condição, ou undefined se nenhum for encontrado. O operador ?? garante que, se find() retornar undefined, seguradoSelecionado será null.
    const seguradoSelecionado =
        segurados?.data?.find(
            (segurado) => segurado.id === seguradoSelecionadoId,
        ) ?? null;

    // Opções do dropdown de status — o valor vai como ?status=... e é tratado
    // em Segurado::scopeFilter() (Ativo = tem apólice dentro da vigência).
    const opcoesFiltro = ['Todos', 'Ativos', 'Inativos'];

    // Lê os parâmetros atuais da URL para inicializar os estados corretamente
    const urlParams =
        typeof window !== 'undefined'
            ? new URLSearchParams(window.location.search)
            : new URLSearchParams();

    // Texto do campo de busca (já com máscara de CPF/CNPJ quando é número).
    const [seguradoPesquisado, setSeguradoPesquisado] = useState(
        urlParams.get('busca') || '',
    );
    const [filtroSelecionado, setFiltroSelecionado] = useState(
        urlParams.get('status') || 'Todos',
    );

    // Ref para controlar o debounce da busca
    const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Função de busca acionada ao digitar (com debounce de 500ms)
    // Recarrega a tabela via GET /clientes?busca=... (SeguradoController::show),
    // voltando para a página 1.
    const handleBuscaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const valorDigitado = e.target.value;

        // Aplica a formatação visual automática (mantém letras ou formata CPF/CNPJ)
        const valorFormatado = formataInputBusca(valorDigitado);
        setSeguradoPesquisado(valorFormatado);

        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }

        searchTimeoutRef.current = setTimeout(() => {
            const params = new URLSearchParams(window.location.search);

            if (valorDigitado.trim() !== '') {
                // Se o usuário digitou números (CPF/CNPJ), enviamos limpo sem pontuação.
                // Se digitou letras (nome), enviamos normal.
                const temLetras = /[a-zA-Z]/.test(valorDigitado);
                const valorParaEnviar = temLetras
                    ? valorDigitado
                    : removeMask(valorDigitado);

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
    // Recarrega a tabela via GET /clientes?status=... e fecha o dropdown.
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

    // Clique numa linha da tabela: destaca a linha e abre esse cliente no
    // painel da direita.
    const selecionarCliente = (segurado: any) => {
        setSeguradoSelecionadoId(segurado.id);
    };

    // No mobile o painel fica abaixo da lista: rola até ele para o operador
    // perceber que o cliente abriu. Chamado só pelos cards (abaixo de lg).
    const rolarAtePainel = () => {
        setTimeout(() => {
            document
                .getElementById('painel-cliente')
                ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 50);
    };

    // Botão "Confirmar exclusão" do diálogo: DELETE /clientes/{id}
    // (SeguradoController::destroy — soft delete do cliente e das apólices).
    // O toast de sucesso vem do flash; aqui só trata erro de rede/validação.
    const confirmarExclusao = () => {
        if (!seguradoParaExcluir) {
            return;
        }

        //{seguradoParaExcluir.id} é o ID do cliente a ser excluído, passado para a rota DELETE
        //id pego pelo front-end, mas a exclusão é feita no back-end, que é quem realmente sabe se o cliente existe ou não.
        router.delete(`/clientes/${seguradoParaExcluir.id}`, {
            onError: () =>
                toast.error('Erro ao excluir cliente. Tente novamente.'),
            onFinish: () => {
                setSeguradoParaExcluir(null);
            },
        });
    };

    // Tratamentos seguros para evitar NaN(Not a Number) caso os valores sejam undefined ou null
    const totalGeral = total ?? 0;
    const totalInativosSegurados = totalInativos ?? 0;
    const totalAtivosSegurados = totalAtivos ?? 0;

    return (
        <>
            <Head title="Clientes" />

            <div className="flex flex-col gap-5 p-4 sm:gap-6 sm:p-8">
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
                        className="h-11 rounded-xl bg-emerald-500 px-5 font-semibold text-white transition-colors hover:bg-emerald-600 active:scale-[0.98]"
                    >
                        <Plus className="mr-2 size-4" />
                        Novo Cliente
                    </Button>
                </div>

                {/* 2. Cards de Estatísticas — flat, sem glow/blur, só borda e cor */}
                <div className="grid grid-cols-3 gap-2 sm:gap-4">
                    <div className="flex items-center justify-between rounded-2xl border border-border/70 bg-card p-3 transition-colors hover:border-emerald-500/30 sm:p-4 lg:p-5">
                        <div className="flex min-w-0 flex-col gap-1">
                            <span className="text-[11px]/tight font-medium text-muted-foreground sm:text-xs">
                                Total de Clientes
                            </span>
                            <span className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl lg:text-3xl">
                                {totalGeral}
                            </span>
                        </div>
                        <div className="hidden h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 lg:flex">
                            <UserRound className="size-5" />
                        </div>
                    </div>
                    <div className="flex items-center justify-between rounded-2xl border border-border/70 bg-card p-3 transition-colors hover:border-emerald-500/30 sm:p-4 lg:p-5">
                        <div className="flex min-w-0 flex-col gap-1">
                            <span className="text-[11px]/tight font-medium text-muted-foreground sm:text-xs">
                                Clientes Ativos
                            </span>
                            <span className="text-xl font-semibold tracking-tight text-emerald-600 sm:text-2xl lg:text-3xl">
                                {totalAtivosSegurados}
                            </span>
                        </div>
                        <div className="hidden h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 lg:flex">
                            <ScrollText className="size-5" />
                        </div>
                    </div>
                    <div className="flex items-center justify-between rounded-2xl border border-border/70 bg-card p-3 transition-colors hover:border-muted-foreground/30 sm:p-4 lg:p-5">
                        <div className="flex min-w-0 flex-col gap-1">
                            <span className="text-[11px]/tight font-medium text-muted-foreground sm:text-xs">
                                Inativos
                            </span>
                            <span className="text-xl font-semibold tracking-tight text-muted-foreground sm:text-2xl lg:text-3xl">
                                {totalInativosSegurados}
                            </span>
                        </div>
                        <div className="hidden h-11 w-11 items-center justify-center rounded-xl bg-muted text-muted-foreground lg:flex">
                            <ScrollText className="size-5" />
                        </div>
                    </div>
                </div>
                {/* 3. Lista de clientes + painel do cliente selecionado, lado a lado */}
                <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,1fr)_460px] lg:items-start">
                    <div className="overflow-hidden rounded-2xl border border-border/70 bg-card">
                        {/* Toolbar */}
                        <div className="flex flex-col justify-between gap-4 border-b border-border/70 p-4 sm:p-5 lg:flex-row lg:items-center">
                            <div>
                                <h3 className="text-sm font-semibold">
                                    Lista de Clientes
                                </h3>
                                <p className="text-xs text-muted-foreground">
                                    {segurados?.total ?? 0} cliente(s)
                                    encontrado(s)
                                </p>
                            </div>
                            <div className="flex flex-wrap items-center gap-2.5">
                                <div className="relative w-full sm:w-auto">
                                    <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground/60" />
                                    <Input
                                        placeholder="Buscar por nome, CPF..."
                                        className="h-10 w-full rounded-xl border border-border/70 bg-background pr-3 pl-9 text-sm transition-colors placeholder:text-muted-foreground/55 hover:border-emerald-500/40 focus-visible:ring-2 focus-visible:ring-emerald-500/20 focus-visible:outline-none sm:w-64"
                                        value={seguradoPesquisado}
                                        onChange={handleBuscaChange}
                                    />
                                </div>
                                {/* Dropdown de filtro por status */}
                                <div className="relative flex-1 sm:flex-initial">
                                    <button
                                        onClick={() =>
                                            setFiltroAberto(!filtroAberto)
                                        }
                                        className="inline-flex h-10 w-full min-w-[120px] items-center justify-between gap-2 rounded-xl border border-border/70 bg-background px-3 text-sm font-medium transition-colors hover:border-emerald-500/40 hover:bg-muted/50 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none sm:w-auto"
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
                                        <div className="absolute left-0 z-50 mt-2 w-40 overflow-hidden rounded-xl border border-border/70 bg-popover py-1.5 shadow-md">
                                            {opcoesFiltro.map((opcao) => (
                                                <button
                                                    key={opcao}
                                                    onClick={() =>
                                                        handleFiltroChange(
                                                            opcao,
                                                        )
                                                    }
                                                    className={`flex w-full cursor-pointer items-center justify-between px-3 py-2 text-sm transition-colors ${
                                                        filtroSelecionado ===
                                                        opcao
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
                                    href="/clientes/exportar"
                                    className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-xl border border-border/70 bg-background px-4 text-sm font-medium transition-colors hover:border-emerald-500/40 hover:bg-muted/50 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none sm:flex-initial"
                                >
                                    <Download className="size-4 text-muted-foreground/60" />
                                    Exportar
                                </a>
                            </div>
                        </div>

                        {/* Lista em cards (mobile e tablet): mesmas informações e ações da
                            tabela, que só aparece a partir de lg. */}
                        <div className="divide-y divide-border/70 lg:hidden">
                            {!segurados?.data || segurados.data.length === 0 ? (
                                <p className="px-4 py-10 text-center text-sm text-muted-foreground">
                                    Nenhum cliente encontrado.
                                </p>
                            ) : (
                                segurados.data.map((segurado) => (
                                    <div
                                        key={segurado.id}
                                        data-abre-painel
                                        role="button"
                                        tabIndex={0}
                                        onClick={() => {
                                            selecionarCliente(segurado);
                                            rolarAtePainel();
                                        }}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                selecionarCliente(segurado);
                                                rolarAtePainel();
                                            }
                                        }}
                                        className={`flex cursor-pointer items-start gap-3 px-4 py-3.5 transition-colors active:bg-muted/[0.18] ${
                                            seguradoSelecionado?.id ===
                                            segurado.id
                                                ? 'bg-emerald-500/5'
                                                : ''
                                        }`}
                                    >
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2">
                                                <p className="truncate font-medium text-foreground">
                                                    {segurado.nome_completo}
                                                </p>
                                                <span
                                                    className={`inline-flex shrink-0 rounded-lg px-2 py-0.5 text-[11px] font-semibold capitalize ${
                                                        segurado.status ===
                                                        'Ativo'
                                                            ? 'bg-emerald-500/10 text-emerald-500'
                                                            : 'bg-muted text-muted-foreground'
                                                    }`}
                                                >
                                                    {segurado.status}
                                                </span>
                                            </div>
                                            <p className="mt-1 text-xs text-muted-foreground">
                                                <span className="font-mono">
                                                    #
                                                    {String(
                                                        segurado.id,
                                                    ).padStart(4, '0')}
                                                </span>
                                                {' · '}
                                                {segurado.cpf_cnpj
                                                    ? formataCpfCnpj(
                                                          segurado.cpf_cnpj,
                                                      )
                                                    : '-'}
                                            </p>
                                            <p className="mt-0.5 truncate text-xs text-muted-foreground">
                                                {segurado.celular_whatsapp ||
                                                    segurado.telefone ||
                                                    '-'}
                                                {' · '}
                                                {segurado.cidade} -{' '}
                                                {segurado.estado}
                                            </p>
                                        </div>
                                        <div className="flex shrink-0 items-center gap-1.5">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                title="Imprimir ficha do segurado"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    window.open(
                                                        `/clientes/${segurado.id}/ficha`,
                                                        '_blank',
                                                    );
                                                }}
                                                className="h-10 w-10 rounded-xl border-border/70 p-0 text-muted-foreground hover:border-emerald-500/40 hover:bg-emerald-500/10 hover:text-emerald-600"
                                            >
                                                <Printer className="size-4" />
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                title="Excluir cliente"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSeguradoParaExcluir(
                                                        segurado,
                                                    );
                                                }}
                                                className="h-10 w-10 rounded-xl border-border/70 p-0 text-muted-foreground hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-500"
                                            >
                                                <Trash2 className="size-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Tabela de segurados */}
                        <div className="hidden overflow-x-auto lg:block">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-border/70 text-muted-foreground">
                                        <th className="h-11 px-4 text-left text-xs font-semibold tracking-wider uppercase">
                                            ID
                                        </th>
                                        <th className="h-11 px-4 text-left text-xs font-semibold tracking-wider uppercase">
                                            Cliente
                                        </th>
                                        <th className="h-11 px-4 text-left text-xs font-semibold tracking-wider uppercase">
                                            CPF/CNPJ
                                        </th>
                                        <th className="h-11 px-4 text-left text-xs font-semibold tracking-wider uppercase">
                                            Telefone/Celular
                                        </th>
                                        <th className="h-11 px-4 text-left text-xs font-semibold tracking-wider uppercase">
                                            Localização
                                        </th>
                                        <th className="h-11 px-4 text-left text-xs font-semibold tracking-wider uppercase">
                                            Status
                                        </th>
                                        <th className="h-11 px-4 text-right text-xs font-semibold tracking-wider uppercase">
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
                                                onClick={() =>
                                                    selecionarCliente(segurado)
                                                }
                                                className={`cursor-pointer border-b border-border/70 transition-colors hover:bg-muted/[0.12] ${
                                                    seguradoSelecionado?.id ===
                                                    segurado.id
                                                        ? 'bg-emerald-500/5'
                                                        : ''
                                                }`}
                                            >
                                                <td className="px-4 py-3.5 font-mono text-xs text-muted-foreground">
                                                    #
                                                    {String(
                                                        segurado.id,
                                                    ).padStart(4, '0')}
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
                                                                : 'bg-muted text-muted-foreground'
                                                        }`}
                                                    >
                                                        {segurado.status}
                                                    </span>
                                                </td>
                                                <td className="flex items-center justify-end gap-1.5 px-4 py-3.5 text-right">
                                                    {/* Ficha abre numa aba própria (Blade, fora do
                                                        Inertia) que já chama o diálogo de impressão. */}
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        title="Imprimir ficha do segurado"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            window.open(
                                                                `/clientes/${segurado.id}/ficha`,
                                                                '_blank',
                                                            );
                                                        }}
                                                        className="h-8 w-8 rounded-xl border-border/70 p-0 text-muted-foreground hover:border-emerald-500/40 hover:bg-emerald-500/10 hover:text-emerald-600"
                                                    >
                                                        <Printer className="size-4" />
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setSeguradoParaExcluir(
                                                                segurado,
                                                            );
                                                        }}
                                                        className="h-8 w-8 rounded-xl border-border/70 p-0 text-muted-foreground hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-500"
                                                    >
                                                        <Trash2 className="size-4" />
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* 4. Paginação */}
                        <div className="flex flex-col gap-4 border-t border-border/70 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
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

                            <div className="flex w-full items-center gap-2 sm:w-auto">
                                {/* Botão Anterior */}
                                {segurados?.prev_page_url ? (
                                    <Link
                                        href={segurados.prev_page_url}
                                        preserveScroll
                                        className="inline-flex h-10 flex-1 items-center justify-center gap-1 rounded-xl border border-border/70 bg-background px-3.5 text-xs font-medium transition-colors hover:border-emerald-500/40 hover:bg-muted/50 sm:h-9 sm:flex-initial"
                                    >
                                        <ChevronLeft className="size-3.5" />
                                        Anterior
                                    </Link>
                                ) : (
                                    <button
                                        disabled
                                        className="inline-flex h-10 flex-1 items-center justify-center gap-1 rounded-xl border border-border/70 bg-background px-3.5 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 sm:h-9 sm:flex-initial"
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
                                        className="inline-flex h-10 flex-1 items-center justify-center gap-1 rounded-xl border border-border/70 bg-background px-3.5 text-xs font-medium transition-colors hover:border-emerald-500/40 hover:bg-muted/50 sm:h-9 sm:flex-initial"
                                    >
                                        Próxima
                                        <ChevronRight className="size-3.5" />
                                    </Link>
                                ) : (
                                    <button
                                        disabled
                                        className="inline-flex h-10 flex-1 items-center justify-center gap-1 rounded-xl border border-border/70 bg-background px-3.5 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 sm:h-9 sm:flex-initial"
                                    >
                                        Próxima
                                        <ChevronRight className="size-3.5" />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Painel do cliente selecionado (coluna direita) */}
                    <PainelCliente
                        key={seguradoSelecionado?.id ?? 'vazio'}
                        segurado={seguradoSelecionado}
                        onExcluir={setSeguradoParaExcluir}
                    />
                </div>
            </div>

            {/* 5. Modais */}
            {/* Modal de criar cliente */}
            <CreateSeguradoModal
                key={openModal}
                open={openModal}
                setOpen={setOpenModal}
            />

            {/* Modal de confirmação de exclusão (aberto pela lixeira da tabela
                ou pelo botão de excluir do painel do cliente) */}
            <Dialog
                open={!!seguradoParaExcluir}
                onOpenChange={(open) => !open && setSeguradoParaExcluir(null)}
            >
                <DialogContent className="rounded-2xl border-border/70 sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-lg font-bold">
                            <AlertTriangle className="size-5 text-rose-500" />
                            Excluir cliente
                        </DialogTitle>
                    </DialogHeader>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                        Tem certeza que deseja excluir o cliente{' '}
                        <span className="font-semibold text-foreground">
                            {seguradoParaExcluir?.nome_completo}
                        </span>
                        ? Todos os dados vinculados a este segurado serão
                        desativados.
                    </p>
                    <div className="mt-2 flex justify-end gap-2">
                        <Button
                            variant="outline"
                            className="rounded-xl"
                            onClick={() => setSeguradoParaExcluir(null)}
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={confirmarExclusao}
                            className="rounded-xl bg-rose-500 text-white shadow-lg shadow-rose-500/25 hover:bg-rose-600"
                        >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Confirmar exclusão
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
