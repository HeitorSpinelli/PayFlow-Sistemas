import { Head, router } from '@inertiajs/react';
import {
    Ban,
    ChevronRight,
    Info,
    MoreVertical,
    PlayCircle,
    RefreshCw,
    RotateCcw,
    ScrollText,
    Search,
    Settings2,
    Shield,
    ShieldCheck,
    Trash2,
    Users as UsersIcon,
    UserRound,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import RenovarApoliceModal from '@/components/modals/renovar-apolice-modal';
import UserProfileModal from '@/components/modals/user-profile-modal';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

interface User {
    id: number;
    name: string;
    email: string;
    role: string;
    created_at?: string;
}

interface SeguradoInativo {
    id: number;
    nome_completo: string;
    cpf_cnpj: string;
    email: string;
    deleted_at: string;
}

interface ApoliceResumo {
    id: number;
    numero_apolice: string;
    valor_premio_total: string | number;
    valor_cobertura: string | number;
    quantidade_parcelas: number;
    inicio_vigencia: string;
    fim_vigencia: string;
    suspensa_em: string | null;
    deleted_at: string | null;
    motivo_cancelamento: string | null;
    cliente?: { nome_completo: string; cpf_cnpj: string } | null;
    seguradora?: { nome_fantasia: string } | null;
    ramo?: { nome_ramo: string } | null;
}

interface Props {
    users: User[];
    inativos: SeguradoInativo[];
    apolicesCanceladas?: ApoliceResumo[];
    apolicesVencidas?: ApoliceResumo[];
    apolicesSuspensas?: ApoliceResumo[];
}

function formatarData(data?: string) {
    if (!data) {
        return '—';
    }

    return new Date(data).toLocaleDateString('pt-BR');
}

function diasDesde(data: string) {
    const dias = Math.floor(
        (Date.now() - new Date(data).getTime()) / (1000 * 60 * 60 * 24),
    );

    if (dias <= 0) {
        return 'hoje';
    }

    if (dias === 1) {
        return 'há 1 dia';
    }

    return `há ${dias} dias`;
}

export default function Administracao({
    users,
    inativos,
    apolicesCanceladas = [],
    apolicesVencidas = [],
    apolicesSuspensas = [],
}: Props) {
    const [openPerfil, setOpenPerfil] = useState(false);
    const [usuarioSelecionado, setUsuarioSelecionado] = useState<User | null>(
        null,
    );
    const [busca, setBusca] = useState('');
    const [openRenovar, setOpenRenovar] = useState(false);
    const [apoliceParaRenovar, setApoliceParaRenovar] =
        useState<ApoliceResumo | null>(null);

    const totalUsuarios = users?.length ?? 0;
    const totalAdmins = useMemo(
        () => users?.filter((u) => u.role === 'admin').length ?? 0,
        [users],
    );
    const totalInativos = inativos?.length ?? 0;

    const usuariosFiltrados = useMemo(() => {
        const termo = busca.trim().toLowerCase();

        if (!termo) {
            return users ?? [];
        }

        return (users ?? []).filter(
            (u) =>
                u.name.toLowerCase().includes(termo) ||
                u.email.toLowerCase().includes(termo),
        );
    }, [users, busca]);

    const abrirPerfil = (user: User) => {
        setUsuarioSelecionado(user);
        setOpenPerfil(true);
    };

    const restaurarSegurado = (id: number) => {
        router.patch(
            `/clientes/restaurar/${id}`,
            {},
            {
                onSuccess: () => {
                    toast.success('Cliente restaurado com sucesso!', {
                        position: 'top-right',
                    });
                },
                onError: () => {
                    toast.error('Erro ao restaurar cliente.', {
                        position: 'top-right',
                    });
                },
            },
        );
    };

    const ativarApolice = (id: number) => {
        router.patch(
            `/apolices/ativar/${id}`,
            {},
            {
                onSuccess: () => {
                    toast.success('Apólice ativada com sucesso!', {
                        position: 'top-right',
                    });
                },
                onError: () => {
                    toast.error('Erro ao ativar apólice.', {
                        position: 'top-right',
                    });
                },
            },
        );
    };

    const abrirRenovacao = (apolice: ApoliceResumo) => {
        setApoliceParaRenovar(apolice);
        setOpenRenovar(true);
    };

    const restaurarApolice = (id: number) => {
        router.patch(
            `/apolices/restaurar/${id}`,
            {},
            {
                onSuccess: () => {
                    toast.success('Apólice restaurada com sucesso!', {
                        position: 'top-right',
                    });
                },
                onError: () => {
                    toast.error('Erro ao restaurar apólice.', {
                        position: 'top-right',
                    });
                },
            },
        );
    };

    // Só exclusão manual e suspensão prolongada podem ser restauradas — ver
    // Apolice::podeSerRestaurada() no backend, fonte da verdade desta regra.
    const podeRestaurarApolice = (motivo: string | null) =>
        motivo === 'manual' || motivo === 'suspensao_prolongada';

    const rotuloMotivoCancelamento = (motivo: string | null) => {
        switch (motivo) {
            case 'atraso_primeira_parcela':
                return 'Atraso da 1ª parcela';
            case 'suspensao_prolongada':
                return 'Suspensão prolongada';
            case 'manual':
                return 'Exclusão manual';
            default:
                return 'Não informado';
        }
    };

    return (
        <>
            <Head title="Administração" />

            <div className="flex flex-col gap-6 p-6 sm:p-8">
                {/* Header da página */}
                <div>
                    <div className="mb-1 flex items-center gap-1.5 text-[10px] font-bold tracking-[0.16em] text-emerald-600 uppercase">
                        <span>Sistema</span>
                        <ChevronRight className="h-3 w-3" />
                        <span>Administração</span>
                    </div>
                    <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
                        Administração do Sistema
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Gerencie usuários, permissões e dados removidos
                    </p>
                </div>

                <Tabs defaultValue="users" className="w-full">
                    <TabsList>
                        <TabsTrigger value="users">
                            <UsersIcon className="mr-1.5 size-4" />
                            Usuários
                        </TabsTrigger>
                        <TabsTrigger value="clientes">
                            <Trash2 className="mr-1.5 size-4" />
                            Clientes Inativos
                        </TabsTrigger>
                        <TabsTrigger value="apolices">
                            <ScrollText className="mr-1.5 size-4" />
                            Apólices Inativas/Vencidas/Canceladas
                        </TabsTrigger>
                        <TabsTrigger value="sistema">
                            <Settings2 className="mr-1.5 size-4" />
                            Sistema
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="users">
                        <div className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm">
                            {/* Toolbar */}
                            <div className="flex flex-col justify-between gap-4 border-b border-border/70 p-4 sm:p-5 lg:flex-row lg:items-center">
                                <div>
                                    <h3 className="text-sm font-bold">
                                        Lista de Usuários
                                    </h3>
                                    <p className="text-xs text-muted-foreground">
                                        {usuariosFiltrados.length} de{' '}
                                        {totalUsuarios} usuário(s)
                                    </p>
                                </div>
                                <div className="relative">
                                    <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground/60" />
                                    <Input
                                        placeholder="Buscar por nome ou email..."
                                        value={busca}
                                        onChange={(e) =>
                                            setBusca(e.target.value)
                                        }
                                        className="h-10 w-full rounded-xl border border-border/70 bg-background pr-3 pl-9 text-sm shadow-sm transition-all placeholder:text-muted-foreground/55 hover:border-emerald-500/40 focus-visible:ring-4 focus-visible:ring-emerald-500/10 focus-visible:outline-none sm:w-72"
                                    />
                                </div>
                            </div>

                            {/* Tabela de Usuários */}
                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse text-left">
                                    <thead>
                                        <tr className="border-b border-border/70 bg-muted/30 text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
                                            <th className="p-4 pl-6">
                                                Usuário
                                            </th>
                                            <th className="p-4">Cargo</th>
                                            <th className="p-4">
                                                Membro desde
                                            </th>
                                            <th className="p-4 pr-6 text-right">
                                                Ações
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/70 text-sm">
                                        {usuariosFiltrados.length === 0 ? (
                                            <tr>
                                                <td
                                                    colSpan={4}
                                                    className="p-10 text-center text-muted-foreground"
                                                >
                                                    Nenhum usuário encontrado.
                                                </td>
                                            </tr>
                                        ) : (
                                            usuariosFiltrados.map((user) => {
                                                const isAdmin =
                                                    user.role === 'admin';

                                                return (
                                                    <tr
                                                        key={user.id}
                                                        className="transition-colors hover:bg-muted/30"
                                                    >
                                                        <td className="flex items-center gap-3 p-4 pl-6">
                                                            <span
                                                                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                                                                    isAdmin
                                                                        ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/25'
                                                                        : 'bg-muted text-muted-foreground'
                                                                }`}
                                                            >
                                                                {user.name
                                                                    .substring(
                                                                        0,
                                                                        2,
                                                                    )
                                                                    .toUpperCase()}
                                                            </span>
                                                            <div className="min-w-0">
                                                                <p className="truncate leading-none font-semibold text-foreground">
                                                                    {user.name}
                                                                </p>
                                                                <p className="mt-1 truncate text-xs text-muted-foreground">
                                                                    {user.email}
                                                                </p>
                                                            </div>
                                                        </td>
                                                        <td className="p-4">
                                                            <span
                                                                className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold ${
                                                                    isAdmin
                                                                        ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-600'
                                                                        : 'border-border/70 bg-muted/50 text-foreground'
                                                                }`}
                                                            >
                                                                {isAdmin ? (
                                                                    <Shield className="size-3.5" />
                                                                ) : (
                                                                    <UserRound className="size-3.5" />
                                                                )}
                                                                {isAdmin
                                                                    ? 'Admin'
                                                                    : 'User'}
                                                            </span>
                                                        </td>
                                                        <td className="p-4 text-muted-foreground">
                                                            {formatarData(
                                                                user.created_at,
                                                            )}
                                                        </td>
                                                        <td className="p-4 pr-6 text-right">
                                                            <button
                                                                onClick={() =>
                                                                    abrirPerfil(
                                                                        user,
                                                                    )
                                                                }
                                                                aria-label="Abrir perfil do usuário"
                                                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                                                            >
                                                                <MoreVertical className="size-4" />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="clientes">
                        <div className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm">
                            <div className="border-b border-border/70 p-4 sm:p-5">
                                <h3 className="text-sm font-bold">
                                    Clientes Inativos (Lixeira)
                                </h3>
                                <p className="text-xs text-muted-foreground">
                                    Clientes excluídos podem ser restaurados a
                                    qualquer momento
                                </p>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse text-left">
                                    <thead>
                                        <tr className="border-b border-border/70 bg-muted/30 text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
                                            <th className="p-4 pl-6">
                                                Cliente
                                            </th>
                                            <th className="p-4">CPF/CNPJ</th>
                                            <th className="p-4">Excluído em</th>
                                            <th className="p-4 pr-6 text-right">
                                                Ações
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/70 text-sm">
                                        {totalInativos === 0 ? (
                                            <tr>
                                                <td
                                                    colSpan={4}
                                                    className="p-10 text-center text-muted-foreground"
                                                >
                                                    Nenhum cliente na lixeira.
                                                </td>
                                            </tr>
                                        ) : (
                                            inativos.map((segurado) => (
                                                <tr
                                                    key={segurado.id}
                                                    className="transition-colors hover:bg-muted/30"
                                                >
                                                    <td className="flex items-center gap-3 p-4 pl-6">
                                                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-rose-500/10 text-rose-500">
                                                            <Trash2 className="size-4" />
                                                        </span>
                                                        <span className="font-semibold text-foreground">
                                                            {
                                                                segurado.nome_completo
                                                            }
                                                        </span>
                                                    </td>
                                                    <td className="p-4 text-muted-foreground">
                                                        {segurado.cpf_cnpj}
                                                    </td>
                                                    <td className="p-4 text-muted-foreground">
                                                        {formatarData(
                                                            segurado.deleted_at,
                                                        )}
                                                        <span className="ml-1.5 text-xs text-muted-foreground/70">
                                                            (
                                                            {diasDesde(
                                                                segurado.deleted_at,
                                                            )}
                                                            )
                                                        </span>
                                                    </td>
                                                    <td className="p-4 pr-6 text-right">
                                                        <button
                                                            onClick={() =>
                                                                restaurarSegurado(
                                                                    segurado.id,
                                                                )
                                                            }
                                                            className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-600 transition-colors hover:bg-emerald-500/20"
                                                        >
                                                            <RotateCcw className="size-3.5" />
                                                            Restaurar
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="apolices">
                        <div className="flex flex-col gap-6">
                            {/* Suspensas (inativas) */}
                            <div className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm">
                                <div className="border-b border-border/70 p-4 sm:p-5">
                                    <h3 className="text-sm font-bold">
                                        Apólices Inativas (Suspensas)
                                    </h3>
                                    <p className="text-xs text-muted-foreground">
                                        Suspensas por atraso de parcela — o
                                        cliente ainda está dentro do prazo de 30
                                        dias antes do cancelamento automático
                                        (Lei 15.040/2024, art. 21)
                                    </p>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full border-collapse text-left">
                                        <thead>
                                            <tr className="border-b border-border/70 bg-muted/30 text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
                                                <th className="p-4 pl-6">
                                                    Apólice
                                                </th>
                                                <th className="p-4">Cliente</th>
                                                <th className="p-4">
                                                    Suspensa em
                                                </th>
                                                <th className="p-4 pr-6 text-right">
                                                    Ações
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border/70 text-sm">
                                            {apolicesSuspensas.length === 0 ? (
                                                <tr>
                                                    <td
                                                        colSpan={4}
                                                        className="p-10 text-center text-muted-foreground"
                                                    >
                                                        Nenhuma apólice suspensa
                                                        no momento.
                                                    </td>
                                                </tr>
                                            ) : (
                                                apolicesSuspensas.map(
                                                    (apolice) => (
                                                        <tr
                                                            key={apolice.id}
                                                            className="transition-colors hover:bg-muted/30"
                                                        >
                                                            <td className="flex items-center gap-3 p-4 pl-6">
                                                                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-500/10 text-amber-500">
                                                                    <Ban className="size-4" />
                                                                </span>
                                                                <span className="font-semibold text-foreground">
                                                                    #
                                                                    {
                                                                        apolice.numero_apolice
                                                                    }
                                                                </span>
                                                            </td>
                                                            <td className="p-4 text-muted-foreground">
                                                                {apolice.cliente
                                                                    ?.nome_completo ??
                                                                    '—'}
                                                            </td>
                                                            <td className="p-4 text-muted-foreground">
                                                                {formatarData(
                                                                    apolice.suspensa_em,
                                                                )}
                                                            </td>
                                                            <td className="p-4 pr-6 text-right">
                                                                <button
                                                                    onClick={() =>
                                                                        ativarApolice(
                                                                            apolice.id,
                                                                        )
                                                                    }
                                                                    className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-600 transition-colors hover:bg-emerald-500/20"
                                                                >
                                                                    <PlayCircle className="size-3.5" />
                                                                    Ativar
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ),
                                                )
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Vencidas */}
                            <div className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm">
                                <div className="border-b border-border/70 p-4 sm:p-5">
                                    <h3 className="text-sm font-bold">
                                        Apólices Vencidas
                                    </h3>
                                    <p className="text-xs text-muted-foreground">
                                        Vigência encerrada — podem ser renovadas
                                        com um novo ciclo de datas e parcelas
                                    </p>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full border-collapse text-left">
                                        <thead>
                                            <tr className="border-b border-border/70 bg-muted/30 text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
                                                <th className="p-4 pl-6">
                                                    Apólice
                                                </th>
                                                <th className="p-4">Cliente</th>
                                                <th className="p-4">
                                                    Vencida em
                                                </th>
                                                <th className="p-4 pr-6 text-right">
                                                    Ações
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border/70 text-sm">
                                            {apolicesVencidas.length === 0 ? (
                                                <tr>
                                                    <td
                                                        colSpan={4}
                                                        className="p-10 text-center text-muted-foreground"
                                                    >
                                                        Nenhuma apólice vencida
                                                        no momento.
                                                    </td>
                                                </tr>
                                            ) : (
                                                apolicesVencidas.map(
                                                    (apolice) => (
                                                        <tr
                                                            key={apolice.id}
                                                            className="transition-colors hover:bg-muted/30"
                                                        >
                                                            <td className="flex items-center gap-3 p-4 pl-6">
                                                                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-500/10 text-amber-500">
                                                                    <RefreshCw className="size-4" />
                                                                </span>
                                                                <span className="font-semibold text-foreground">
                                                                    #
                                                                    {
                                                                        apolice.numero_apolice
                                                                    }
                                                                </span>
                                                            </td>
                                                            <td className="p-4 text-muted-foreground">
                                                                {apolice.cliente
                                                                    ?.nome_completo ??
                                                                    '—'}
                                                            </td>
                                                            <td className="p-4 text-muted-foreground">
                                                                {formatarData(
                                                                    apolice.fim_vigencia,
                                                                )}
                                                            </td>
                                                            <td className="p-4 pr-6 text-right">
                                                                <button
                                                                    onClick={() =>
                                                                        abrirRenovacao(
                                                                            apolice,
                                                                        )
                                                                    }
                                                                    className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-600 transition-colors hover:bg-emerald-500/20"
                                                                >
                                                                    <RefreshCw className="size-3.5" />
                                                                    Renovar
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ),
                                                )
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Canceladas */}
                            <div className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm">
                                <div className="border-b border-border/70 p-4 sm:p-5">
                                    <h3 className="text-sm font-bold">
                                        Apólices Canceladas
                                    </h3>
                                    <p className="text-xs text-muted-foreground">
                                        Canceladas por atraso da 1ª parcela não
                                        têm restauração (a cobertura nunca
                                        chegou a valer) — as demais podem voltar
                                    </p>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full border-collapse text-left">
                                        <thead>
                                            <tr className="border-b border-border/70 bg-muted/30 text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
                                                <th className="p-4 pl-6">
                                                    Apólice
                                                </th>
                                                <th className="p-4">Cliente</th>
                                                <th className="p-4">
                                                    Cancelada em
                                                </th>
                                                <th className="p-4">Motivo</th>
                                                <th className="p-4 pr-6 text-right">
                                                    Ações
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border/70 text-sm">
                                            {apolicesCanceladas.length === 0 ? (
                                                <tr>
                                                    <td
                                                        colSpan={5}
                                                        className="p-10 text-center text-muted-foreground"
                                                    >
                                                        Nenhuma apólice
                                                        cancelada.
                                                    </td>
                                                </tr>
                                            ) : (
                                                apolicesCanceladas.map(
                                                    (apolice) => (
                                                        <tr
                                                            key={apolice.id}
                                                            className="transition-colors hover:bg-muted/30"
                                                        >
                                                            <td className="flex items-center gap-3 p-4 pl-6">
                                                                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-rose-500/10 text-rose-500">
                                                                    <Trash2 className="size-4" />
                                                                </span>
                                                                <span className="font-semibold text-foreground">
                                                                    #
                                                                    {
                                                                        apolice.numero_apolice
                                                                    }
                                                                </span>
                                                            </td>
                                                            <td className="p-4 text-muted-foreground">
                                                                {apolice.cliente
                                                                    ?.nome_completo ??
                                                                    '—'}
                                                            </td>
                                                            <td className="p-4 text-muted-foreground">
                                                                {formatarData(
                                                                    apolice.deleted_at,
                                                                )}
                                                            </td>
                                                            <td className="p-4 text-muted-foreground">
                                                                {rotuloMotivoCancelamento(
                                                                    apolice.motivo_cancelamento,
                                                                )}
                                                            </td>
                                                            <td className="p-4 pr-6 text-right">
                                                                {podeRestaurarApolice(
                                                                    apolice.motivo_cancelamento,
                                                                ) ? (
                                                                    <button
                                                                        onClick={() =>
                                                                            restaurarApolice(
                                                                                apolice.id,
                                                                            )
                                                                        }
                                                                        className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-600 transition-colors hover:bg-emerald-500/20"
                                                                    >
                                                                        <RotateCcw className="size-3.5" />
                                                                        Restaurar
                                                                    </button>
                                                                ) : (
                                                                    <span className="text-xs font-medium text-rose-500">
                                                                        Cancelamento
                                                                        definitivo
                                                                    </span>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    ),
                                                )
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="sistema">
                        <div className="grid gap-4 lg:grid-cols-2">
                            <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
                                <div className="mb-4 flex items-center gap-3">
                                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
                                        <ShieldCheck className="size-5" />
                                    </span>
                                    <div>
                                        <h3 className="text-sm font-bold">
                                            Proteção de administradores
                                        </h3>
                                        <p className="text-xs text-muted-foreground">
                                            Regra de segurança ativa
                                        </p>
                                    </div>
                                </div>
                                <p className="text-sm leading-relaxed text-muted-foreground">
                                    O sistema não permite remover o cargo do{' '}
                                    <strong className="text-foreground">
                                        último administrador
                                    </strong>{' '}
                                    restante. Hoje há{' '}
                                    <strong className="text-foreground">
                                        {totalAdmins} administrador
                                        {totalAdmins === 1 ? '' : 'es'}
                                    </strong>{' '}
                                    com esse nível de acesso.
                                </p>
                            </div>

                            <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
                                <div className="mb-4 flex items-center gap-3">
                                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600">
                                        <Info className="size-5" />
                                    </span>
                                    <div>
                                        <h3 className="text-sm font-bold">
                                            Sobre os cargos
                                        </h3>
                                        <p className="text-xs text-muted-foreground">
                                            Diferença entre Admin e User
                                        </p>
                                    </div>
                                </div>
                                <p className="text-sm leading-relaxed text-muted-foreground">
                                    Usuários com cargo{' '}
                                    <strong className="text-foreground">
                                        Admin
                                    </strong>{' '}
                                    têm acesso a seguradoras, notificações,
                                    automações e a esta área de administração.
                                    Usuários com cargo{' '}
                                    <strong className="text-foreground">
                                        User
                                    </strong>{' '}
                                    ficam restritos às áreas operacionais do dia
                                    a dia.
                                </p>
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>
            </div>

            {usuarioSelecionado && (
                <UserProfileModal
                    open={openPerfil}
                    setOpen={setOpenPerfil}
                    user={usuarioSelecionado}
                />
            )}

            <RenovarApoliceModal
                open={openRenovar}
                setOpen={setOpenRenovar}
                apolice={apoliceParaRenovar}
            />
        </>
    );
}
