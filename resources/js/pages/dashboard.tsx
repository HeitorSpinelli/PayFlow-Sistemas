import { useMemo } from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import {
    ArrowDownRight,
    ArrowUpRight,
    Bell,
    Building2,
    Calendar,
    ChevronRight,
    Clock,
    FileSpreadsheet,
    Send,
    ShieldCheck,
    Sparkles,
    UserRoundX,
    Users,
    Wallet,
} from 'lucide-react';
import { apolices } from '@/routes';

interface VencimentoProximo {
    id: number;
    cliente: string;
    apolice: string;
    valor: number;
    dias: number;
    status: 'atrasado' | 'pendente';
}

interface Props {
    totalClientes: number;
    apolicesAtivas: number;
    clientesDevedores: number;
    receitaDoMes: number;
    vencimentosProximos: VencimentoProximo[];
}

/* ------------------------------------------------------------------ */
/* Dados de exemplo — trocar pelos dados reais vindos do Inertia      */
/* ------------------------------------------------------------------ */

const RECEITA_MENSAL = [
    { mes: 'Mar', valor: 18200 },
    { mes: 'Abr', valor: 21400 },
    { mes: 'Mai', valor: 19800 },
    { mes: 'Jun', valor: 24100 },
    { mes: 'Jul', valor: 26700 },
    { mes: 'Ago', valor: 23950 },
];

const NOTIFICACOES_RECENTES = [
    {
        id: 1,
        texto: 'Cobrança enviada para Maria Souza',
        tempo: 'há 12 min',
        status: 'enviado' as const,
    },
    {
        id: 2,
        texto: 'Falha ao notificar Juliana Castro',
        tempo: 'há 40 min',
        status: 'falha' as const,
    },
    {
        id: 3,
        texto: 'Lembrete de renovação — Carlos Lima',
        tempo: 'há 2h',
        status: 'enviado' as const,
    },
    {
        id: 4,
        texto: 'Cobrança pendente — Roberto Dias',
        tempo: 'há 3h',
        status: 'pendente' as const,
    },
];

const AÇÕES_RAPIDAS = [
    { titulo: 'Nova Seguradora', href: '/seguradoras', icon: Building2 },
    { titulo: 'Agenda de Pagamentos', href: '/agenda', icon: Calendar },
    {
        titulo: 'Importar Dados',
        href: '/importar-dados',
        icon: FileSpreadsheet,
    },
    { titulo: 'Enviar Notificação', href: '/notificacoes', icon: Send },
];

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function formatarMoeda(valor: number) {
    return valor.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    });
}

const STATUS_VENCIMENTO = {
    atrasado: {
        label: 'Atrasado',
        badge: 'border-red-500/20 bg-red-500/10 text-red-600',
    },
    pendente: {
        label: 'A vencer',
        badge: 'border-amber-500/20 bg-amber-500/10 text-amber-600',
    },
};

const STATUS_NOTIFICACAO = {
    enviado: { dot: 'bg-emerald-500' },
    pendente: { dot: 'bg-amber-500' },
    falha: { dot: 'bg-red-500' },
};

/* ------------------------------------------------------------------ */
/* Componente principal                                               */
/* ------------------------------------------------------------------ */

export default function Dashboard({
    totalClientes,
    apolicesAtivas,
    clientesDevedores,
    receitaDoMes,
    vencimentosProximos = [],
}: Props) {
    const { auth } = usePage().props as unknown as {
        auth: { user: { name: string } };
    };

    const primeiroNome = auth?.user?.name?.split(' ')[0] ?? 'por aqui';
    const dataHoje = new Date().toLocaleDateString('pt-BR', {
        weekday: 'long',
        day: '2-digit',
        month: 'long',
    });

    const maxReceita = useMemo(
        () => Math.max(...RECEITA_MENSAL.map((d) => d.valor)),
        [],
    );

    return (
        <>
            <Head title="Dashboard" />

            <div className="flex flex-col gap-6 p-6 sm:p-8">
                {/* Saudação */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <p className="mb-1 flex items-center gap-1.5 text-[10px] font-bold tracking-[0.16em] text-emerald-600 uppercase">
                            <Sparkles className="size-3" />
                            {dataHoje}
                        </p>
                        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                            Olá Novamente, {primeiroNome}!
                        </h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Aqui está um resumo da sua operação hoje.
                        </p>
                    </div>
                </div>

                {/* KPIs */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="relative overflow-hidden rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
                        <div className="pointer-events-none absolute -top-10 -right-10 h-28 w-28 rounded-full bg-emerald-500/10 blur-2xl" />
                        <div className="relative flex items-start justify-between">
                            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
                                <Users className="size-5" />
                            </span>
                            <span className="flex items-center gap-0.5 text-xs font-bold text-emerald-600">
                                <ArrowUpRight className="size-3.5" />
                                +8
                            </span>
                        </div>
                        <p className="relative mt-4 text-2xl font-bold text-foreground">
                            {totalClientes}
                        </p>
                        <p className="relative text-xs font-semibold text-muted-foreground">
                            Total de Clientes
                        </p>
                    </div>

                    <div className="relative overflow-hidden rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
                        <div className="pointer-events-none absolute -top-10 -right-10 h-28 w-28 rounded-full bg-emerald-500/10 blur-2xl" />
                        <div className="relative flex items-start justify-between">
                            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
                                <ShieldCheck className="size-5" />
                            </span>
                            <span className="flex items-center gap-0.5 text-xs font-bold text-emerald-600">
                                <ArrowUpRight className="size-3.5" />
                                +14
                            </span>
                        </div>
                        <p className="relative mt-4 text-2xl font-bold text-foreground">
                            {apolicesAtivas}
                        </p>
                        <p className="relative text-xs font-semibold text-muted-foreground">
                            Apólices Ativas
                        </p>
                    </div>

                    <div className="relative overflow-hidden rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
                        <div className="pointer-events-none absolute -top-10 -right-10 h-28 w-28 rounded-full bg-red-500/10 blur-2xl" />
                        <div className="relative flex items-start justify-between">
                            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-500/10 text-red-600">
                                <UserRoundX className="size-5" />
                            </span>
                            <span className="flex items-center gap-0.5 text-xs font-bold text-emerald-600">
                                <ArrowDownRight className="size-3.5" />
                                -3
                            </span>
                        </div>
                        <p className="relative mt-4 text-2xl font-bold text-foreground">
                            {clientesDevedores}
                        </p>
                        <p className="relative text-xs font-semibold text-muted-foreground">
                            Clientes Devedores
                        </p>
                    </div>

                    <div className="relative overflow-hidden rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
                        <div className="pointer-events-none absolute -top-10 -right-10 h-28 w-28 rounded-full bg-emerald-500/10 blur-2xl" />
                        <div className="relative flex items-start justify-between">
                            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
                                <Wallet className="size-5" />
                            </span>
                            <span className="flex items-center gap-0.5 text-xs font-bold text-emerald-600">
                                <ArrowUpRight className="size-3.5" />
                                +7,2%
                            </span>
                        </div>
                        <p className="relative mt-4 text-2xl font-bold text-foreground">
                            {formatarMoeda(receitaDoMes)}
                        </p>
                        <p className="relative text-xs font-semibold text-muted-foreground">
                            Receita do Mês
                        </p>
                    </div>
                </div>

                {/* Corpo: gráfico + vencimentos | ações rápidas + notificações */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.7fr_1fr]">
                    <div className="flex flex-col gap-6">
                        {/* Gráfico de receita */}
                        <div className="rounded-2xl border border-border/70 bg-card p-6 shadow-sm">
                            <div className="mb-6 flex items-center justify-between">
                                <div>
                                    <h2 className="text-base font-bold tracking-tight text-foreground">
                                        Receita mensal
                                    </h2>
                                    <p className="text-xs text-muted-foreground">
                                        Últimos 6 meses
                                    </p>
                                </div>
                                <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-bold text-emerald-600">
                                    +7,2% vs. mês anterior
                                </span>
                            </div>

                            <div className="flex h-48 items-end gap-3 sm:gap-5">
                                {RECEITA_MENSAL.map((item, idx) => {
                                    const altura = Math.max(
                                        (item.valor / maxReceita) * 100,
                                        6,
                                    );
                                    const atual =
                                        idx === RECEITA_MENSAL.length - 1;
                                    return (
                                        <div
                                            key={item.mes}
                                            className="flex flex-1 flex-col items-center gap-2"
                                        >
                                            <div className="flex h-full w-full items-end">
                                                <div
                                                    style={{
                                                        height: `${altura}%`,
                                                    }}
                                                    className={`w-full rounded-t-lg transition-all ${
                                                        atual
                                                            ? 'bg-gradient-to-t from-emerald-600 to-emerald-400 shadow-lg shadow-emerald-500/30'
                                                            : 'bg-emerald-500/15'
                                                    }`}
                                                />
                                            </div>
                                            <span
                                                className={`text-[11px] font-bold ${
                                                    atual
                                                        ? 'text-emerald-600'
                                                        : 'text-muted-foreground'
                                                }`}
                                            >
                                                {item.mes}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Vencimentos próximos */}
                        <div className="rounded-2xl border border-border/70 bg-card p-6 shadow-sm">
                            <div className="mb-4 flex items-center justify-between">
                                <div>
                                    <h2 className="text-base font-bold tracking-tight text-foreground">
                                        Vencimentos próximos
                                    </h2>
                                    <p className="text-xs text-muted-foreground">
                                        Clientes com pagamentos a vencer ou em
                                        atraso
                                    </p>
                                </div>
                                <Link
                                    href="/agenda"
                                    className="flex items-center gap-1 text-xs font-bold text-emerald-600 hover:text-emerald-700"
                                >
                                    Ver agenda
                                    <ChevronRight className="size-3.5" />
                                </Link>
                            </div>

                            <div className="flex flex-col">
                                {vencimentosProximos.length === 0 && (
                                    <p className="py-6 text-center text-sm text-muted-foreground">
                                        Nenhum vencimento em atraso ou próximo.
                                    </p>
                                )}
                                {vencimentosProximos.map((item) => (
                                    <div
                                        key={item.id}
                                        className="flex items-center justify-between gap-3 border-b border-border/40 py-3 last:border-0"
                                    >
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-bold text-foreground">
                                                {item.cliente}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                Apólice {item.apolice} ·{' '}
                                                {item.status === 'atrasado'
                                                    ? `${item.dias === 0 ? 'vence hoje' : `${item.dias} dia(s) em atraso`}`
                                                    : `vence em ${item.dias} dia(s)`}
                                            </p>
                                        </div>
                                        <div className="flex shrink-0 items-center gap-3">
                                            <span className="text-sm font-bold text-foreground">
                                                {formatarMoeda(item.valor)}
                                            </span>
                                            <span
                                                className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${STATUS_VENCIMENTO[item.status].badge}`}
                                            >
                                                {
                                                    STATUS_VENCIMENTO[
                                                        item.status
                                                    ].label
                                                }
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Coluna lateral */}
                    <div className="flex flex-col gap-6">
                        {/* Ações rápidas */}
                        <div className="rounded-2xl border border-border/70 bg-card p-6 shadow-sm">
                            <h2 className="mb-4 text-base font-bold tracking-tight text-foreground">
                                Ações rápidas
                            </h2>
                            <div className="flex flex-col gap-2">
                                {AÇÕES_RAPIDAS.map((acao) => {
                                    const Icon = acao.icon;
                                    return (
                                        <Link
                                            key={acao.titulo}
                                            href={acao.href}
                                            className="group flex items-center gap-3 rounded-xl border border-border/60 px-3.5 py-3 transition-all hover:border-emerald-500/40 hover:bg-emerald-500/5"
                                        >
                                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600">
                                                <Icon className="size-4" />
                                            </span>
                                            <span className="flex-1 text-sm font-semibold text-foreground">
                                                {acao.titulo}
                                            </span>
                                            <ChevronRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Notificações recentes */}
                        <div className="rounded-2xl border border-border/70 bg-card p-6 shadow-sm">
                            <div className="mb-4 flex items-center justify-between">
                                <h2 className="flex items-center gap-2 text-base font-bold tracking-tight text-foreground">
                                    <Bell className="size-4 text-emerald-600" />
                                    Notificações
                                </h2>
                                <Link
                                    href="/notificacoes"
                                    className="text-xs font-bold text-emerald-600 hover:text-emerald-700"
                                >
                                    Ver todas
                                </Link>
                            </div>

                            <div className="flex flex-col gap-4">
                                {NOTIFICACOES_RECENTES.map((n) => (
                                    <div
                                        key={n.id}
                                        className="flex items-start gap-3"
                                    >
                                        <span
                                            className={`mt-1.5 size-2 shrink-0 rounded-full ${STATUS_NOTIFICACAO[n.status].dot}`}
                                        />
                                        <div className="min-w-0">
                                            <p className="text-sm text-foreground">
                                                {n.texto}
                                            </p>
                                            <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
                                                <Clock className="size-3" />
                                                {n.tempo}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
