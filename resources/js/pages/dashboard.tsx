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
    Sparkles,
    UserRoundX,
} from 'lucide-react';
import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';

interface VencimentoProximo {
    id: number;
    cliente: string;
    apolice: string;
    valor: number;
    dias: number;
    status: 'atrasado' | 'pendente';
}

interface DistribuicaoRamo {
    tipo: string;
    total: number;
}

interface Props {
    clientesDevedores: number;
    vencimentosProximos: VencimentoProximo[];
    receitaMensal: Record<string, any>[];
    clientesAtivosMensal: Record<string, any>[];
    distribuicaoPorRamo: DistribuicaoRamo[];
}

/* ------------------------------------------------------------------ */
/* Dados de exemplo — só o que ainda não vem do backend                */
/* ------------------------------------------------------------------ */

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

// Paleta das fatias da pizza — ancorada nas 3 cores que o resto do sistema
// já usa (emerald = positivo, amber = pendente, rose = atenção/negativo),
// variando tom/saturação em vez de introduzir matizes novos (azul, roxo, etc.)
const CORES_RAMO = [
    '#10b981', // emerald-500
    '#f59e0b', // amber-500
    '#f43f5e', // rose-500
    '#6ee7b7', // emerald-300
    '#fcd34d', // amber-300
    '#fda4af', // rose-300
    '#94a3b8', // slate-400 (fallback neutro)
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

// Calcula a variação percentual entre o último e o penúltimo ponto de uma
// série mensal (mês atual vs. mês anterior). Retorna null quando não há
// base de comparação válida (ex: mês anterior com valor 0).
function useVariacaoMensal(serie: Record<string, any>[], campo: string) {
    return useMemo(() => {
        const atual = serie[serie.length - 1]?.[campo] ?? 0;
        const anterior = serie[serie.length - 2]?.[campo] ?? 0;
        if (anterior <= 0) return null;
        return ((atual - anterior) / anterior) * 100;
    }, [serie, campo]);
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
/* Componente reutilizável — elimina a duplicação entre os dois        */
/* gráficos de barra mensais (Receita e Clientes ativos), que antes    */
/* eram ~90 linhas quase idênticas copiadas e coladas.                 */
/* ------------------------------------------------------------------ */

interface TrendBarChartProps {
    title: string;
    subtitle: string;
    data: Record<string, any>[];
    dataKey: string;
    color: string;
    mutedColor: string;
    cursorColor: string;
    variacao: number | null;
    tooltipFormatter: (value: number) => string;
    emptyMessage: string;
}

function TrendBarChart({
    title,
    subtitle,
    data,
    dataKey,
    color,
    mutedColor,
    cursorColor,
    variacao,
    tooltipFormatter,
    emptyMessage,
}: TrendBarChartProps) {
    return (
        <div className="relative overflow-hidden rounded-2xl border border-border/70 bg-card p-6 shadow-sm">
            <div className="pointer-events-none absolute -top-10 -right-10 h-28 w-28 rounded-full bg-emerald-500/10 blur-2xl" />

            <div className="relative mb-5 flex items-start justify-between gap-2">
                <div>
                    <h2 className="text-sm font-bold tracking-tight text-foreground">
                        {title}
                    </h2>
                    <p className="text-xs text-muted-foreground">{subtitle}</p>
                </div>
                {variacao !== null && (
                    <span
                        className={`flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold ${
                            variacao >= 0
                                ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-600'
                                : 'border-red-500/20 bg-red-500/10 text-red-600'
                        }`}
                    >
                        {variacao >= 0 ? (
                            <ArrowUpRight className="size-3" />
                        ) : (
                            <ArrowDownRight className="size-3" />
                        )}
                        {Math.abs(variacao).toFixed(1)}%
                    </span>
                )}
            </div>

            {data.length === 0 ? (
                <p className="relative py-10 text-center text-sm text-muted-foreground">
                    {emptyMessage}
                </p>
            ) : (
                <div className="relative h-40">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={data}
                            margin={{ top: 4, right: 0, left: 0, bottom: 0 }}
                        >
                            <CartesianGrid
                                vertical={false}
                                className="stroke-border/40"
                            />
                            <XAxis
                                dataKey="mes"
                                tickLine={false}
                                axisLine={false}
                                tick={{ fontSize: 11 }}
                                className="fill-muted-foreground"
                            />
                            <YAxis hide />
                            <Tooltip
                                content={({ active, payload }: any) =>
                                    active && payload?.length ? (
                                        <div className="rounded-lg border border-border/70 bg-popover px-3 py-2 text-xs shadow-md">
                                            <p className="font-bold text-foreground">
                                                {tooltipFormatter(
                                                    payload[0].value,
                                                )}
                                            </p>
                                        </div>
                                    ) : null
                                }
                                cursor={{ fill: cursorColor }}
                            />
                            <Bar dataKey={dataKey} radius={[6, 6, 0, 0]}>
                                {data.map((_, idx) => (
                                    <Cell
                                        key={idx}
                                        fill={
                                            idx === data.length - 1
                                                ? color
                                                : mutedColor
                                        }
                                    />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}
        </div>
    );
}

/* ------------------------------------------------------------------ */
/* Componente principal                                               */
/* ------------------------------------------------------------------ */

export default function Dashboard({
    clientesDevedores,
    vencimentosProximos = [],
    receitaMensal = [],
    clientesAtivosMensal = [],
    distribuicaoPorRamo = [],
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

    const variacaoReceita = useVariacaoMensal(receitaMensal, 'valor');
    const variacaoClientes = useVariacaoMensal(clientesAtivosMensal, 'total');

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

                {/* Faixa de alerta — Clientes Devedores */}
                <div className="relative flex items-center justify-between overflow-hidden rounded-2xl border border-rose-500/20 bg-rose-500/[0.04] px-5 py-4 shadow-sm sm:px-6">
                    <div className="pointer-events-none absolute -top-12 -right-8 h-32 w-32 rounded-full bg-rose-500/10 blur-3xl" />
                    <div className="relative flex items-center gap-3.5">
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-rose-500/10 text-rose-600">
                            <UserRoundX className="size-5" />
                        </span>
                        <div>
                            <p className="text-2xl font-bold text-foreground">
                                {clientesDevedores}
                            </p>
                            <p className="text-xs font-semibold text-muted-foreground">
                                {clientesDevedores === 1
                                    ? 'Cliente com parcela vencida'
                                    : 'Clientes com parcelas vencidas'}
                            </p>
                        </div>
                    </div>
                    {clientesDevedores > 0 && (
                        <Link
                            href="/agenda"
                            className="relative flex shrink-0 items-center gap-1 text-xs font-bold text-rose-600 hover:text-rose-700"
                        >
                            Ver agenda
                            <ChevronRight className="size-3.5" />
                        </Link>
                    )}
                </div>

                {/* Corpo: gráficos + vencimentos | pizza + ações rápidas + notificações */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.7fr_1fr]">
                    <div className="flex flex-col gap-6">
                        {/* Receita e Clientes ativos lado a lado */}
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                            <TrendBarChart
                                title="Receita mensal"
                                subtitle="Últimos 6 meses"
                                data={receitaMensal}
                                dataKey="valor"
                                color="#10b981"
                                mutedColor="rgba(16,185,129,0.22)"
                                cursorColor="rgba(16,185,129,0.08)"
                                variacao={variacaoReceita}
                                tooltipFormatter={(v) => formatarMoeda(v)}
                                emptyMessage="Nenhum pagamento confirmado no período."
                            />
                            <TrendBarChart
                                title="Clientes ativos"
                                subtitle="Últimos 6 meses"
                                data={clientesAtivosMensal}
                                dataKey="total"
                                color="#0d9488"
                                mutedColor="rgba(13,148,136,0.22)"
                                cursorColor="rgba(13,148,136,0.08)"
                                variacao={variacaoClientes}
                                tooltipFormatter={(v) =>
                                    `${v} cliente(s) ativo(s)`
                                }
                                emptyMessage="Nenhum dado de cliente ativo no período."
                            />
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
                        {/* Distribuição por tipo de seguro (pizza) */}
                        <div className="rounded-2xl border border-border/70 bg-card p-6 shadow-sm">
                            <h2 className="mb-1 text-base font-bold tracking-tight text-foreground">
                                Tipos de seguro
                            </h2>
                            <p className="mb-4 text-xs text-muted-foreground">
                                Apólices por ramo, todas as seguradoras
                            </p>

                            {distribuicaoPorRamo.length === 0 ? (
                                <p className="py-8 text-center text-sm text-muted-foreground">
                                    Nenhuma apólice cadastrada ainda.
                                </p>
                            ) : (
                                <>
                                    <div className="h-52">
                                        <ResponsiveContainer
                                            width="100%"
                                            height="100%"
                                        >
                                            <PieChart>
                                                <Pie
                                                    data={distribuicaoPorRamo}
                                                    dataKey="total"
                                                    nameKey="tipo"
                                                    innerRadius={48}
                                                    outerRadius={78}
                                                    paddingAngle={2}
                                                >
                                                    {distribuicaoPorRamo.map(
                                                        (_, idx) => (
                                                            <Cell
                                                                key={idx}
                                                                fill={
                                                                    CORES_RAMO[
                                                                        idx %
                                                                            CORES_RAMO.length
                                                                    ]
                                                                }
                                                            />
                                                        ),
                                                    )}
                                                </Pie>
                                                <Tooltip
                                                    content={({
                                                        active,
                                                        payload,
                                                    }: any) =>
                                                        active &&
                                                        payload?.length ? (
                                                            <div className="rounded-lg border border-border/70 bg-popover px-3 py-2 text-xs shadow-md">
                                                                <p className="font-bold text-foreground">
                                                                    {
                                                                        payload[0]
                                                                            .name
                                                                    }
                                                                </p>
                                                                <p className="text-muted-foreground">
                                                                    {
                                                                        payload[0]
                                                                            .value
                                                                    }{' '}
                                                                    apólice(s)
                                                                </p>
                                                            </div>
                                                        ) : null
                                                    }
                                                />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
                                        {distribuicaoPorRamo.map(
                                            (item, idx) => (
                                                <div
                                                    key={item.tipo}
                                                    className="flex items-center gap-1.5 text-xs"
                                                >
                                                    <span
                                                        className="size-2.5 shrink-0 rounded-full"
                                                        style={{
                                                            backgroundColor:
                                                                CORES_RAMO[
                                                                    idx %
                                                                        CORES_RAMO.length
                                                                ],
                                                        }}
                                                    />
                                                    <span className="font-medium text-foreground">
                                                        {item.tipo}
                                                    </span>
                                                    <span className="text-muted-foreground">
                                                        ({item.total})
                                                    </span>
                                                </div>
                                            ),
                                        )}
                                    </div>
                                </>
                            )}
                        </div>

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
