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
import { useState } from 'react';
import { toast } from 'sonner';
import ConfigNotificacaoModal from '@/components/modals/configuracoes-notificacoes-modal';
import NotificacaoModal from '@/components/modals/create-notificacao-modal';
import { Button } from '@/components/ui/button';
import type { Segurado, Automacao } from '@/types/notificacoes';

type Canal = 'email' | 'whatsapp';
type StatusNotificacao = 'enviado' | 'pendente' | 'falha';

interface NotificacaoItem {
    id: number;
    canal: string;
    mensagem: string;
    status: string;
    erro: string | null;
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
    automacoes: Automacao[];
    totalHoje: number;
    totalEnviados: number;
    totalFalhas: number;
}

// Rótulo e cor do selo da coluna "Status" da tabela do histórico.
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

// Nome e ícone de cada canal, usados na coluna "Canal" da tabela.
const CANAL_CONFIG: Record<Canal, { label: string; icon: typeof Mail }> = {
    email: { label: 'E-mail', icon: Mail },
    whatsapp: { label: 'WhatsApp', icon: MessageCircle },
};

// Chave liga/desliga. Obs.: hoje não é usada — a aba Automações desenha o
// próprio botão inline (mesmo visual).
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

/**
 * Tela "Notificações" — URL /notificacoes (somente admin).
 * Props entregues pela closure da rota 'notificacoes' em routes/web.php:
 * totais dos cards, `tipos` de notificação, `segurados` (destinatários do
 * envio manual), `notificacoes` (histórico paginado) e `automacoes`.
 *
 * Seções, de cima para baixo:
 * 1. Cabeçalho com "Configurar" (ConfigNotificacaoModal: tipos e automações,
 *    via /tipo_notificacoes e /automacoes) e "Nova notificação";
 * 2. Cards de métricas (hoje, enviadas, falhas);
 * 3. Cards de canal (E-mail / WhatsApp) — cada um abre NotificacaoModal já
 *    no canal escolhido (envio manual → POST /notificacoes);
 * 4. Abas: "Histórico" (busca, filtros de canal e status, tabela, paginação)
 *    e "Automações" (lista com liga/desliga de cada regra).
 */
export default function Notificacoes({
    tipos,
    segurados,
    notificacoes,
    automacoes,
    totalHoje,
    totalEnviados,
    totalFalhas,
}: Props) {
    // Aba visível: tabela do histórico ou lista de automações.
    const [aba, setAba] = useState<'historico' | 'automacoes'>('historico');
    // Canal do modal de envio manual; null = modal fechado.
    const [modalCanal, setModalCanal] = useState<Canal | null>(null);
    // Abre/fecha o modal "Configurar" (tipos de notificação e automações).
    const [configAberto, setConfigAberto] = useState(false);

    // Estados dos filtros do histórico. Começam com o que está na URL, para
    // que um F5 com filtro aplicado mostre os selects batendo com a tabela.
    const urlParams =
        typeof window !== 'undefined'
            ? new URLSearchParams(window.location.search)
            : new URLSearchParams();
    const [filtroCanal, setFiltroCanal] = useState(
        urlParams.get('canal') || '',
    );
    const [filtroStatus, setFiltroStatus] = useState(
        urlParams.get('status') || '',
    );
    const [busca, setBusca] = useState(urlParams.get('busca') || '');

    // Recarrega SÓ a tabela do histórico (only: ['notificacoes']) via
    // GET /notificacoes (NotificacoesController::index), com os filtros de
    // canal/status, a busca no texto da mensagem e a página na query string.
    // Usada pelos filtros, pela busca e pelos botões de paginação.
    const buscarNotificacoes = (params: {
        canal?: string;
        status?: string;
        busca?: string;
        page?: number;
    }) => {
        const query: Record<string, string> = {};

        if (params.canal) {
            query.canal = params.canal;
        }

        if (params.status) {
            query.status = params.status;
        }

        if (params.busca) {
            query.busca = params.busca;
        }

        if (params.page) {
            query.page = String(params.page);
        }

        router.get('/notificacoes', query, {
            preserveState: true,
            preserveScroll: true,
            only: ['notificacoes'],
        });
    };

    // Abrem/fecham o modal de envio manual no canal escolhido.
    const abrirModal = (canal: Canal) => setModalCanal(canal);
    const fecharModal = () => setModalCanal(null);

    // O toast de sucesso não é mostrado aqui — o layout já mostra
    // automaticamente a partir da flash message do backend.
    // Chave de uma automação na aba "Automações": PATCH /automacoes/{id}/toggle
    // invertendo o `ativo` (AutomacoesController::toggle). A lista atualiza
    // com a recarga do Inertia.
    const toggleAutomacao = (id: number, ativo: boolean) => {
        router.patch(
            `/automacoes/${id}/toggle`,
            { ativo: !ativo },
            {
                onError: () => {
                    toast.error('Erro ao atualizar automação.');
                },
            },
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
                            className="h-11 flex-1 rounded-xl px-5 font-bold sm:flex-initial"
                            onClick={() => setConfigAberto(true)}
                        >
                            <Settings className="mr-2 size-4" /> Configurar
                        </Button>
                        <Button
                            onClick={() => abrirModal('email')}
                            className="h-11 flex-1 rounded-xl bg-emerald-500 px-5 font-bold text-white shadow-lg shadow-emerald-500/20 transition-all hover:bg-emerald-600 active:scale-[0.98] sm:flex-initial"
                        >
                            <Send className="mr-2 size-4" /> Enviar Notificação
                        </Button>
                    </div>
                </div>

                {/* Cards de métricas (no celular: 3 lado a lado, sem ícone) */}
                <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
                    <div className="flex items-center justify-between rounded-2xl border border-border/70 bg-card p-3 shadow-sm sm:p-5">
                        <div>
                            <p className="text-[11px] font-semibold text-muted-foreground sm:text-xs">
                                Total Hoje
                            </p>
                            <p className="mt-1 text-xl font-bold text-foreground sm:text-2xl">
                                {totalHoje}
                            </p>
                        </div>
                        <span className="hidden h-11 w-11 items-center justify-center rounded-xl border border-border/70 text-muted-foreground sm:flex">
                            <Bell className="size-5" />
                        </span>
                    </div>
                    <div className="flex items-center justify-between rounded-2xl border border-border/70 bg-card p-3 shadow-sm sm:p-5">
                        <div>
                            <p className="text-[11px] font-semibold text-muted-foreground sm:text-xs">
                                Enviados
                            </p>
                            <p className="mt-1 text-xl font-bold text-emerald-600 sm:text-2xl">
                                {totalEnviados}
                            </p>
                        </div>
                        <span className="hidden h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 sm:flex">
                            <CheckCircle2 className="size-5" />
                        </span>
                    </div>
                    <div className="flex items-center justify-between rounded-2xl border border-border/70 bg-card p-3 shadow-sm sm:p-5">
                        <div>
                            <p className="text-[11px] font-semibold text-muted-foreground sm:text-xs">
                                Falhas
                            </p>
                            <p className="mt-1 text-xl font-bold text-red-500 sm:text-2xl">
                                {totalFalhas}
                            </p>
                        </div>
                        <span className="hidden h-11 w-11 items-center justify-center rounded-xl bg-red-500/10 text-red-500 sm:flex">
                            <XCircle className="size-5" />
                        </span>
                    </div>
                </div>

                {/* Cards de canal (no celular: lado a lado, compactos, sem descrição) */}
                <div className="grid grid-cols-2 gap-3 sm:gap-5">
                    <button
                        onClick={() => abrirModal('email')}
                        className="group relative flex flex-col overflow-hidden rounded-3xl border border-border/70 bg-card p-1.5 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-sky-500/40 hover:shadow-lg"
                    >
                        <div className="relative flex h-24 items-center justify-center overflow-hidden rounded-[1.35rem] bg-neutral-950 sm:h-40">
                            <div className="absolute inset-0 bg-gradient-to-b from-sky-400/25 via-sky-400/5 to-transparent" />
                            <div className="absolute h-32 w-32 rounded-full bg-gradient-to-br from-sky-300 to-sky-600 opacity-40 blur-3xl" />
                            <div className="relative flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-sky-300 to-sky-600 shadow-2xl shadow-sky-500/40 transition-transform duration-300 group-hover:scale-105 sm:h-20 sm:w-20">
                                <Mail
                                    className="size-7 text-white sm:size-9"
                                    strokeWidth={2}
                                />
                            </div>
                        </div>
                        <div className="flex items-center justify-between gap-3 px-3 py-3 sm:px-5 sm:py-4">
                            <div>
                                <p className="text-base font-bold text-foreground">
                                    E-mail
                                </p>
                                <p className="hidden text-xs text-muted-foreground sm:block">
                                    Envie cobranças e lembretes para um ou mais
                                    clientes
                                </p>
                            </div>
                            <span className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sky-500/10 text-sky-600 transition-transform group-hover:translate-x-0.5 sm:flex">
                                <ArrowRight className="size-4" />
                            </span>
                        </div>
                    </button>
                    <button
                        onClick={() => abrirModal('whatsapp')}
                        className="group relative flex flex-col overflow-hidden rounded-3xl border border-border/70 bg-card p-1.5 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-emerald-500/40 hover:shadow-lg"
                    >
                        <div className="relative flex h-24 items-center justify-center overflow-hidden rounded-[1.35rem] bg-neutral-950 sm:h-40">
                            <div className="absolute inset-0 bg-gradient-to-b from-emerald-400/25 via-emerald-400/5 to-transparent" />
                            <div className="absolute h-32 w-32 rounded-full bg-gradient-to-br from-emerald-300 to-emerald-600 opacity-40 blur-3xl" />
                            <div className="relative flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-emerald-300 to-emerald-600 shadow-2xl shadow-emerald-500/40 transition-transform duration-300 group-hover:scale-105 sm:h-20 sm:w-20">
                                <MessageCircle
                                    className="size-7 text-white sm:size-9"
                                    strokeWidth={1.75}
                                />
                            </div>
                        </div>
                        <div className="flex items-center justify-between gap-3 px-3 py-3 sm:px-5 sm:py-4">
                            <div>
                                <p className="text-base font-bold text-foreground">
                                    WhatsApp
                                </p>
                                <p className="hidden text-xs text-muted-foreground sm:block">
                                    Envie cobranças e lembretes para um ou mais
                                    clientes
                                </p>
                            </div>
                            <span className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 transition-transform group-hover:translate-x-0.5 sm:flex">
                                <ArrowRight className="size-4" />
                            </span>
                        </div>
                    </button>
                </div>

                {/* Abas */}
                <div className="flex w-full gap-1 rounded-xl border border-border/70 bg-card p-1 sm:inline-flex sm:w-fit">
                    <button
                        onClick={() => setAba('historico')}
                        className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-bold transition-colors sm:flex-initial sm:py-2 ${aba === 'historico' ? 'bg-emerald-500 text-white shadow' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                        Histórico
                    </button>
                    <button
                        onClick={() => setAba('automacoes')}
                        className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-bold transition-colors sm:flex-initial sm:py-2 ${aba === 'automacoes' ? 'bg-emerald-500 text-white shadow' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                        Automações
                    </button>
                </div>

                {/* Conteúdo da aba: Histórico (tabela) ou Automações (lista) */}
                {aba === 'historico' ? (
                    <div className="rounded-2xl border border-border/70 bg-card shadow-sm">
                        {/* Cabeçalho com filtros e busca */}
                        <div className="flex flex-col gap-4 border-b border-border/70 p-4 sm:p-5">
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
                                    <div className="relative w-full sm:w-auto">
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
                                            className="h-10 w-full rounded-xl border border-border/70 bg-background pr-3 pl-9 text-sm focus:ring-2 focus:ring-emerald-500/30 focus:outline-none sm:w-auto"
                                        />
                                    </div>
                                    {/* Filtro Canal */}
                                    <div className="relative flex-1 sm:flex-initial">
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
                                            className="h-10 w-full appearance-none rounded-xl border border-border/70 bg-background pr-8 pl-3 text-sm font-semibold text-foreground focus:ring-2 focus:ring-emerald-500/30 focus:outline-none sm:w-auto"
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
                                    <div className="relative flex-1 sm:flex-initial">
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
                                            className="h-10 w-full appearance-none rounded-xl border border-border/70 bg-background pr-8 pl-3 text-sm font-semibold text-foreground focus:ring-2 focus:ring-emerald-500/30 focus:outline-none sm:w-auto"
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
                            {/* Celular/tablet: uma notificação por card, com
                                as mesmas colunas da tabela (que só aparece a
                                partir de lg). */}
                            <div className="divide-y divide-border/50 lg:hidden">
                                {historicoData.map((item) => {
                                    const statusKey =
                                        item.status.toLowerCase() as StatusNotificacao;
                                    const CanalIcon =
                                        CANAL_CONFIG[item.canal as Canal]?.icon;

                                    return (
                                        <div
                                            key={item.id}
                                            className="flex flex-col gap-1.5 px-4 py-4"
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <p className="min-w-0 font-semibold break-words text-foreground">
                                                    {item.tipo_notificacao
                                                        ?.nome_notificacao ??
                                                        '-'}
                                                </p>
                                                <span
                                                    title={
                                                        statusKey === 'falha' &&
                                                        item.erro
                                                            ? item.erro
                                                            : undefined
                                                    }
                                                    className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${STATUS_CONFIG[statusKey]?.badge ?? ''}`}
                                                >
                                                    {STATUS_CONFIG[statusKey]
                                                        ?.label ?? item.status}
                                                </span>
                                            </div>
                                            <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
                                                <span>
                                                    {item.segurado
                                                        ?.nome_completo ?? '-'}
                                                </span>
                                                <span className="inline-flex items-center gap-1.5">
                                                    {CanalIcon && (
                                                        <CanalIcon className="size-3.5" />
                                                    )}
                                                    {CANAL_CONFIG[
                                                        item.canal as Canal
                                                    ]?.label ?? item.canal}
                                                </span>
                                            </p>
                                            {item.mensagem && (
                                                <p className="line-clamp-2 text-sm text-muted-foreground">
                                                    {item.mensagem}
                                                </p>
                                            )}
                                            <p className="text-xs text-muted-foreground/80">
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
                                            </p>
                                            {statusKey === 'falha' &&
                                                item.erro && (
                                                    <p className="text-xs text-red-500">
                                                        {item.erro}
                                                    </p>
                                                )}
                                        </div>
                                    );
                                })}
                                {historicoData.length === 0 && (
                                    <p className="px-4 py-10 text-center text-sm text-muted-foreground">
                                        Nenhuma notificação encontrada.
                                    </p>
                                )}
                            </div>

                            <table className="hidden w-full min-w-[720px] text-left text-sm lg:table">
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
                                                        title={
                                                            statusKey ===
                                                                'falha' &&
                                                            item.erro
                                                                ? item.erro
                                                                : undefined
                                                        }
                                                        className={`rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${statusKey === 'falha' && item.erro ? 'cursor-help' : ''} ${STATUS_CONFIG[statusKey]?.badge ?? ''}`}
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
                                        className="flex h-10 w-10 items-center justify-center rounded-lg border border-border/70 text-muted-foreground hover:bg-muted disabled:opacity-40 sm:h-8 sm:w-8"
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
                                        className="flex h-10 w-10 items-center justify-center rounded-lg border border-border/70 text-muted-foreground hover:bg-muted disabled:opacity-40 sm:h-8 sm:w-8"
                                    >
                                        <ChevronRight className="size-4" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="flex flex-col gap-4">
                        {automacoes.length === 0 ? (
                            <div className="rounded-2xl border border-border/70 bg-card p-10 text-center shadow-sm">
                                <p className="text-sm text-muted-foreground">
                                    Nenhuma automação cadastrada.
                                </p>
                                <p className="mt-1 text-xs text-muted-foreground">
                                    Clique em "Configurar" para criar
                                    automações.
                                </p>
                            </div>
                        ) : (
                            automacoes.map((automacao) => (
                                <div
                                    key={automacao.id}
                                    className="flex flex-col items-start gap-4 rounded-2xl border border-border/70 bg-card p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:gap-0 sm:p-5"
                                >
                                    <div className="flex items-start gap-3">
                                        <span
                                            className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${automacao.ativo ? 'bg-emerald-500/10 text-emerald-600' : 'bg-muted text-muted-foreground'}`}
                                        >
                                            <Bell className="size-5" />
                                        </span>
                                        <div>
                                            <p className="text-sm font-bold text-foreground">
                                                {automacao.tipo_condicao ===
                                                    'apolice_vencendo' &&
                                                    'Apólice vencendo'}
                                                {automacao.tipo_condicao ===
                                                    'parcela_vencendo' &&
                                                    'Parcela vencendo'}
                                                {automacao.tipo_condicao ===
                                                    'parcela_em_atraso' &&
                                                    'Parcela em atraso'}
                                                {automacao.tipo_condicao ===
                                                    'cliente_inativo' &&
                                                    'Cliente inativo'}
                                                <span className="ml-2 text-xs font-normal text-muted-foreground">
                                                    — {automacao.dias} dia(s)
                                                    {automacao.intervalo_dias
                                                        ? `, repete a cada ${automacao.intervalo_dias}d`
                                                        : ''}
                                                </span>
                                            </p>
                                            <p className="mt-0.5 text-xs text-muted-foreground">
                                                {automacao.canal === 'email'
                                                    ? 'E-mail'
                                                    : 'WhatsApp'}
                                                {automacao.tipo_notificacao &&
                                                    ` · ${automacao.tipo_notificacao.nome_notificacao}`}
                                            </p>
                                            <p className="mt-0.5 max-w-lg text-xs leading-relaxed text-muted-foreground">
                                                {automacao.mensagem}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex w-full items-center justify-between gap-3 border-t border-border/50 pt-3 sm:w-auto sm:justify-start sm:border-t-0 sm:pt-0">
                                        <span className="text-xs font-semibold text-muted-foreground">
                                            {automacao.ativo
                                                ? 'Ativado'
                                                : 'Desativado'}
                                        </span>
                                        <button
                                            onClick={() =>
                                                toggleAutomacao(
                                                    automacao.id,
                                                    automacao.ativo,
                                                )
                                            }
                                            className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${automacao.ativo ? 'bg-emerald-500' : 'bg-muted'}`}
                                        >
                                            <span
                                                className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${automacao.ativo ? 'translate-x-5' : 'translate-x-0'}`}
                                            />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>

            {/* Modais: envio manual (key={modalCanal} recria ao trocar de canal) e configurações */}
            <NotificacaoModal
                key={modalCanal}
                canal={modalCanal}
                onClose={fecharModal}
                segurados={segurados}
                tipos={tipos}
            />
            <ConfigNotificacaoModal
                key={String(configAberto)}
                aberto={configAberto}
                onClose={() => setConfigAberto(false)}
                tipos={tipos}
                automacoes={automacoes}
            />
        </>
    );
}
