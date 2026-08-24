import { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import {
    ArrowRight,
    Bell,
    CheckCircle2,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    Clock,
    Mail,
    MessageCircle,
    Search,
    Send,
    Settings,
    XCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import NotificacaoModal from '@/components/modals/create-notificacao-modal';
import ConfigNotificacaoModal from '@/components/modals/configuracoes-notificacoes-modal';
import { Segurado } from '@/types/notificacoes';

type Canal = 'email' | 'whatsapp';
type StatusNotificacao = 'enviado' | 'pendente' | 'falha';

interface NotificacaoItem {
    id: number;
    canal: string;
    mensagem: string;
    status: string;
    data_envio: string;
    segurado: { nome_completo: string };
    tipo_notificacao: { nome_notificacao: string } | null;
}

interface PaginatedNotificacoes {
    data: NotificacaoItem[];
    current_page: number;
    last_page: number;
    total: number;
    per_page: number;
}

interface Props {
    tipos: { id: number; nome_notificacao: string; ativo: boolean }[];
    segurados: Segurado[];
    notificacoes: PaginatedNotificacoes;
}

interface Automacao {
    id: number;
    titulo: string;
    descricao: string;
    canais: Canal[];
    ativo: boolean;
}

const AUTOMACOES_MOCK: Automacao[] = [
    {
        id: 1,
        titulo: 'Lembrete de vencimento',
        descricao:
            'Avisa o cliente automaticamente 3 dias antes do vencimento da parcela.',
        canais: ['email', 'whatsapp'],
        ativo: true,
    },
    {
        id: 2,
        titulo: 'Cobrança em atraso',
        descricao:
            'Dispara uma cobrança assim que um pagamento passa a estar em atraso.',
        canais: ['whatsapp'],
        ativo: true,
    },
    {
        id: 3,
        titulo: 'Renovação de apólice',
        descricao:
            'Lembra o cliente quando a apólice está próxima da data de renovação.',
        canais: ['email'],
        ativo: false,
    },
];

const STATUS_CONFIG: Record<
    StatusNotificacao,
    { label: string; badge: string }
> = {
    enviado: {
        label: 'Enviado',
        badge: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-600',
    },
    pendente: {
        label: 'Pendente',
        badge: 'border-amber-500/20 bg-amber-500/10 text-amber-600',
    },
    falha: {
        label: 'Falha',
        badge: 'border-red-500/20 bg-red-500/10 text-red-600',
    },
};

const CANAL_CONFIG: Record<Canal, { label: string; icon: typeof Mail }> = {
    email: { label: 'E-mail', icon: Mail },
    whatsapp: { label: 'WhatsApp', icon: MessageCircle },
};

function Toggle({ ativo, onChange }: { ativo: boolean; onChange: () => void }) {
    return (
        <button
            onClick={onChange}
            aria-pressed={ativo}
            className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${ativo ? 'bg-emerald-500' : 'bg-muted'}`}
        >
            <span
                className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${ativo ? 'translate-x-5' : 'translate-x-0'}`}
            />
        </button>
    );
}

export default function Notificacoes({
    tipos,
    segurados,
    notificacoes,
}: Props) {
    const [aba, setAba] = useState<'historico' | 'automacoes'>('historico');
    const [automacoes, setAutomacoes] = useState(AUTOMACOES_MOCK);
    const [modalCanal, setModalCanal] = useState<Canal | null>(null);
    const [configAberto, setConfigAberto] = useState(false);

    // Estados dos filtros do histórico
    const [filtroCanal, setFiltroCanal] = useState('');
    const [filtroStatus, setFiltroStatus] = useState('');
    const [busca, setBusca] = useState('');

    const totalHoje = 10;
    const totalEnviados = 20;
    const totalPendentes = 30;
    const totalFalhas = 7;

    const buscarNotificacoes = (params: {
        canal?: string;
        status?: string;
        busca?: string;
        page?: number;
    }) => {
        const query: Record<string, string> = {};
        if (params.canal) query.canal = params.canal;
        if (params.status) query.status = params.status;
        if (params.busca) query.busca = params.busca;
        if (params.page) query.page = String(params.page);

        router.get('/notificacoes/filtrar', query, {
            preserveState: true,
            preserveScroll: true,
            only: ['notificacoes'],
        });
    };

    const abrirModal = (canal: Canal) => setModalCanal(canal);
    const fecharModal = () => setModalCanal(null);
    const alternarAutomacao = (id: number) => {
        setAutomacoes((prev) =>
            prev.map((a) => (a.id === id ? { ...a, ativo: !a.ativo } : a)),
        );
    };

    const historicoData = notificacoes?.data ?? [];

    return (
        <>
            <Head title="Notificações" />
            <div className="flex flex-col gap-6 p-6 sm:p-8">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <p className="mb-1 text-[10px] font-bold tracking-[0.16em] text-emerald-600 uppercase">
                            Gestão
                        </p>
                        <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                            Notificações
                        </h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Gerencie lembretes automáticos e envio de
                            notificações
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            className="h-11 rounded-xl px-5 font-bold"
                            onClick={() => setConfigAberto(true)}
                        >
                            <Settings className="mr-2 size-4" /> Configurar
                        </Button>
                        <Button
                            onClick={() => abrirModal('email')}
                            className="h-11 rounded-xl bg-emerald-500 px-5 font-bold text-white shadow-lg shadow-emerald-500/20 transition-all hover:bg-emerald-600 active:scale-[0.98]"
                        >
                            <Send className="mr-2 size-4" /> Enviar Notificação
                        </Button>
                    </div>
                </div>

                {/* Cards de métricas */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="flex items-center justify-between rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
                        <div>
                            <p className="text-xs font-semibold text-muted-foreground">
                                Total Hoje
                            </p>
                            <p className="mt-1 text-2xl font-bold text-foreground">
                                {totalHoje}
                            </p>
                        </div>
                        <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-border/70 text-muted-foreground">
                            <Bell className="size-5" />
                        </span>
                    </div>
                    <div className="flex items-center justify-between rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
                        <div>
                            <p className="text-xs font-semibold text-muted-foreground">
                                Enviados
                            </p>
                            <p className="mt-1 text-2xl font-bold text-emerald-600">
                                {totalEnviados}
                            </p>
                        </div>
                        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
                            <CheckCircle2 className="size-5" />
                        </span>
                    </div>
                    <div className="flex items-center justify-between rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
                        <div>
                            <p className="text-xs font-semibold text-muted-foreground">
                                Pendentes
                            </p>
                            <p className="mt-1 text-2xl font-bold text-amber-500">
                                {totalPendentes}
                            </p>
                        </div>
                        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500">
                            <Clock className="size-5" />
                        </span>
                    </div>
                    <div className="flex items-center justify-between rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
                        <div>
                            <p className="text-xs font-semibold text-muted-foreground">
                                Falhas
                            </p>
                            <p className="mt-1 text-2xl font-bold text-red-500">
                                {totalFalhas}
                            </p>
                        </div>
                        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-500/10 text-red-500">
                            <XCircle className="size-5" />
                        </span>
                    </div>
                </div>

                {/* Cards de canal */}
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <button
                        onClick={() => abrirModal('email')}
                        className="group relative flex flex-col overflow-hidden rounded-3xl border border-border/70 bg-card p-1.5 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-sky-500/40 hover:shadow-lg"
                    >
                        <div className="relative flex h-36 items-center justify-center overflow-hidden rounded-[1.35rem] bg-neutral-950 sm:h-40">
                            <div className="absolute inset-0 bg-gradient-to-b from-sky-400/25 via-sky-400/5 to-transparent" />
                            <div className="absolute h-32 w-32 rounded-full bg-gradient-to-br from-sky-300 to-sky-600 opacity-40 blur-3xl" />
                            <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-sky-300 to-sky-600 shadow-2xl shadow-sky-500/40 transition-transform duration-300 group-hover:scale-105">
                                <Mail
                                    className="size-9 text-white"
                                    strokeWidth={1.75}
                                />
                            </div>
                        </div>
                        <div className="flex items-center justify-between gap-3 px-5 py-4">
                            <div>
                                <p className="text-base font-bold text-foreground">
                                    E-mail
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    Envie cobranças e lembretes para um ou mais
                                    clientes
                                </p>
                            </div>
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sky-500/10 text-sky-600 transition-transform group-hover:translate-x-0.5">
                                <ArrowRight className="size-4" />
                            </span>
                        </div>
                    </button>
                    <button
                        onClick={() => abrirModal('whatsapp')}
                        className="group relative flex flex-col overflow-hidden rounded-3xl border border-border/70 bg-card p-1.5 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-emerald-500/40 hover:shadow-lg"
                    >
                        <div className="relative flex h-36 items-center justify-center overflow-hidden rounded-[1.35rem] bg-neutral-950 sm:h-40">
                            <div className="absolute inset-0 bg-gradient-to-b from-emerald-400/25 via-emerald-400/5 to-transparent" />
                            <div className="absolute h-32 w-32 rounded-full bg-gradient-to-br from-emerald-300 to-emerald-600 opacity-40 blur-3xl" />
                            <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-emerald-300 to-emerald-600 shadow-2xl shadow-emerald-500/40 transition-transform duration-300 group-hover:scale-105">
                                <MessageCircle
                                    className="size-9 text-white"
                                    strokeWidth={1.75}
                                />
                            </div>
                        </div>
                        <div className="flex items-center justify-between gap-3 px-5 py-4">
                            <div>
                                <p className="text-base font-bold text-foreground">
                                    WhatsApp
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    Envie cobranças e lembretes para um ou mais
                                    clientes
                                </p>
                            </div>
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 transition-transform group-hover:translate-x-0.5">
                                <ArrowRight className="size-4" />
                            </span>
                        </div>
                    </button>
                </div>

                {/* Abas */}
                <div className="inline-flex w-fit gap-1 rounded-xl border border-border/70 bg-card p-1">
                    <button
                        onClick={() => setAba('historico')}
                        className={`rounded-lg px-4 py-2 text-sm font-bold transition-colors ${aba === 'historico' ? 'bg-emerald-500 text-white shadow' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                        Histórico
                    </button>
                    <button
                        onClick={() => setAba('automacoes')}
                        className={`rounded-lg px-4 py-2 text-sm font-bold transition-colors ${aba === 'automacoes' ? 'bg-emerald-500 text-white shadow' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                        Automações
                    </button>
                </div>

                {aba === 'historico' ? (
                    <div className="rounded-2xl border border-border/70 bg-card shadow-sm">
                        {/* Cabeçalho com filtros e busca */}
                        <div className="flex flex-col gap-4 border-b border-border/70 p-5">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <h2 className="text-base font-bold tracking-tight text-foreground">
                                        Histórico de Notificações
                                    </h2>
                                    <p className="text-xs text-muted-foreground">
                                        {notificacoes?.total ?? 0}{' '}
                                        notificação(ões) encontrada(s)
                                    </p>
                                </div>
                                <div className="flex flex-wrap items-center gap-2">
                                    {/* Busca */}
                                    <div className="relative">
                                        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                                        <input
                                            value={busca}
                                            onChange={(e) =>
                                                setBusca(e.target.value)
                                            }
                                            onKeyDown={(e) =>
                                                e.key === 'Enter' &&
                                                buscarNotificacoes({
                                                    canal: filtroCanal,
                                                    status: filtroStatus,
                                                    busca,
                                                })
                                            }
                                            placeholder="Buscar..."
                                            className="h-10 rounded-xl border border-border/70 bg-background pr-3 pl-9 text-sm focus:ring-2 focus:ring-emerald-500/30 focus:outline-none"
                                        />
                                    </div>
                                    {/* Filtro Canal */}
                                    <div className="relative">
                                        <select
                                            value={filtroCanal}
                                            onChange={(e) => {
                                                setFiltroCanal(e.target.value);
                                                buscarNotificacoes({
                                                    canal: e.target.value,
                                                    status: filtroStatus,
                                                    busca,
                                                });
                                            }}
                                            className="h-10 appearance-none rounded-xl border border-border/70 bg-background pr-8 pl-3 text-sm font-semibold text-foreground focus:ring-2 focus:ring-emerald-500/30 focus:outline-none"
                                        >
                                            <option value="">
                                                Todos os canais
                                            </option>
                                            <option value="email">
                                                E-mail
                                            </option>
                                            <option value="whatsapp">
                                                WhatsApp
                                            </option>
                                        </select>
                                        <ChevronDown className="pointer-events-none absolute top-1/2 right-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
                                    </div>
                                    {/* Filtro Status */}
                                    <div className="relative">
                                        <select
                                            value={filtroStatus}
                                            onChange={(e) => {
                                                setFiltroStatus(e.target.value);
                                                buscarNotificacoes({
                                                    canal: filtroCanal,
                                                    status: e.target.value,
                                                    busca,
                                                });
                                            }}
                                            className="h-10 appearance-none rounded-xl border border-border/70 bg-background pr-8 pl-3 text-sm font-semibold text-foreground focus:ring-2 focus:ring-emerald-500/30 focus:outline-none"
                                        >
                                            <option value="">
                                                Todos os status
                                            </option>
                                            <option value="Enviado">
                                                Enviado
                                            </option>
                                            <option value="Pendente">
                                                Pendente
                                            </option>
                                            <option value="Falha">Falha</option>
                                        </select>
                                        <ChevronDown className="pointer-events-none absolute top-1/2 right-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Tabela */}
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[720px] text-left text-sm">
                                <thead>
                                    <tr className="border-b border-border/70 text-[10px] font-bold tracking-[0.1em] text-muted-foreground uppercase">
                                        <th className="px-5 py-3">Tipo</th>
                                        <th className="px-5 py-3">
                                            Destinatário
                                        </th>
                                        <th className="px-5 py-3">Canal</th>
                                        <th className="px-5 py-3">Mensagem</th>
                                        <th className="px-5 py-3">
                                            Data Envio
                                        </th>
                                        <th className="px-5 py-3">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {historicoData.map((item) => {
                                        const statusKey =
                                            item.status.toLowerCase() as StatusNotificacao;
                                        const CanalIcon =
                                            CANAL_CONFIG[item.canal as Canal]
                                                ?.icon;
                                        return (
                                            <tr
                                                key={item.id}
                                                className="border-b border-border/40 transition-colors last:border-0 hover:bg-muted/40"
                                            >
                                                <td className="px-5 py-3.5 font-semibold text-foreground">
                                                    {item.tipo_notificacao
                                                        ?.nome_notificacao ??
                                                        '-'}
                                                </td>
                                                <td className="px-5 py-3.5 text-muted-foreground">
                                                    {item.segurado
                                                        ?.nome_completo ?? '-'}
                                                </td>
                                                <td className="px-5 py-3.5">
                                                    <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                                                        {CanalIcon && (
                                                            <CanalIcon className="size-3.5" />
                                                        )}
                                                        {CANAL_CONFIG[
                                                            item.canal as Canal
                                                        ]?.label ?? item.canal}
                                                    </span>
                                                </td>
                                                <td className="max-w-[220px] truncate px-5 py-3.5 text-muted-foreground">
                                                    {item.mensagem}
                                                </td>
                                                <td className="px-5 py-3.5 text-muted-foreground">
                                                    {item.data_envio
                                                        ? new Date(
                                                              item.data_envio,
                                                          ).toLocaleString(
                                                              'pt-BR',
                                                              {
                                                                  timeZone:
                                                                      'America/Sao_Paulo',
                                                              },
                                                          )
                                                        : '-'}
                                                </td>
                                                <td className="px-5 py-3.5">
                                                    <span
                                                        className={`rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${STATUS_CONFIG[statusKey]?.badge ?? ''}`}
                                                    >
                                                        {STATUS_CONFIG[
                                                            statusKey
                                                        ]?.label ?? item.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {historicoData.length === 0 && (
                                        <tr>
                                            <td
                                                colSpan={6}
                                                className="px-5 py-10 text-center text-sm text-muted-foreground"
                                            >
                                                Nenhuma notificação encontrada.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Paginação */}
                        {notificacoes && notificacoes.last_page > 1 && (
                            <div className="flex items-center justify-between border-t border-border/70 px-5 py-4">
                                <p className="text-xs text-muted-foreground">
                                    Página {notificacoes.current_page} de{' '}
                                    {notificacoes.last_page}
                                </p>
                                <div className="flex items-center gap-2">
                                    <button
                                        disabled={
                                            notificacoes.current_page === 1
                                        }
                                        onClick={() =>
                                            buscarNotificacoes({
                                                canal: filtroCanal,
                                                status: filtroStatus,
                                                busca,
                                                page:
                                                    notificacoes.current_page -
                                                    1,
                                            })
                                        }
                                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/70 text-muted-foreground hover:bg-muted disabled:opacity-40"
                                    >
                                        <ChevronLeft className="size-4" />
                                    </button>
                                    <button
                                        disabled={
                                            notificacoes.current_page ===
                                            notificacoes.last_page
                                        }
                                        onClick={() =>
                                            buscarNotificacoes({
                                                canal: filtroCanal,
                                                status: filtroStatus,
                                                busca,
                                                page:
                                                    notificacoes.current_page +
                                                    1,
                                            })
                                        }
                                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/70 text-muted-foreground hover:bg-muted disabled:opacity-40"
                                    >
                                        <ChevronRight className="size-4" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="flex flex-col gap-4">
                        {automacoes.map((automacao) => (
                            <div
                                key={automacao.id}
                                className="flex flex-col gap-4 rounded-2xl border border-border/70 bg-card p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between"
                            >
                                <div className="flex items-start gap-3">
                                    <span
                                        className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${automacao.ativo ? 'bg-emerald-500/10 text-emerald-600' : 'bg-muted text-muted-foreground'}`}
                                    >
                                        <Bell className="size-5" />
                                    </span>
                                    <div>
                                        <p className="text-sm font-bold text-foreground">
                                            {automacao.titulo}
                                        </p>
                                        <p className="mt-0.5 max-w-lg text-xs leading-relaxed text-muted-foreground">
                                            {automacao.descricao}
                                        </p>
                                        <div className="mt-2 flex items-center gap-1.5">
                                            {automacao.canais.map((canal) => {
                                                const CanalIcon =
                                                    CANAL_CONFIG[canal].icon;
                                                return (
                                                    <span
                                                        key={canal}
                                                        className="flex items-center gap-1 rounded-full border border-border/70 px-2 py-0.5 text-[10px] font-semibold text-muted-foreground"
                                                    >
                                                        <CanalIcon className="size-3" />
                                                        {
                                                            CANAL_CONFIG[canal]
                                                                .label
                                                        }
                                                    </span>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 pl-13 sm:pl-0">
                                    <span className="text-xs font-semibold text-muted-foreground">
                                        {automacao.ativo
                                            ? 'Ativado'
                                            : 'Desativado'}
                                    </span>
                                    <Toggle
                                        ativo={automacao.ativo}
                                        onChange={() =>
                                            alternarAutomacao(automacao.id)
                                        }
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <NotificacaoModal
                canal={modalCanal}
                onClose={fecharModal}
                segurados={segurados}
                tipos={tipos}
            />
            <ConfigNotificacaoModal
                aberto={configAberto}
                onClose={() => setConfigAberto(false)}
                tipos={tipos}
            />
        </>
    );
}
