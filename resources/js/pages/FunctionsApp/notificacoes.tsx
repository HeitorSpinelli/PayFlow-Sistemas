import { useMemo, useState } from 'react';
import { Head } from '@inertiajs/react';
import {
    ArrowRight,
    Bell,
    Check,
    CheckCircle2,
    ChevronDown,
    Clock,
    Mail,
    MessageCircle,
    Search,
    Send,
    Settings,
    X,
    XCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import NotificacaoModal from '@/components/modals/create-notificacao-modal';
import { Segurado } from '@/types/notificacoes';

/* ------------------------------------------------------------------ */
/* Tipos                                                              */
/* ------------------------------------------------------------------ */

type Canal = 'email' | 'whatsapp';
type StatusNotificacao = 'enviado' | 'pendente' | 'falha';

interface Cliente {
    id: number;
    nome: string;
    email: string;
    telefone: string;
    devedor: boolean;
}

interface NotificacaoHistorico {
    id: number;
    tipo: string;
    destinatario: string;
    canal: Canal;
    mensagem: string;
    dataEnvio: string;
    status: StatusNotificacao;
}

interface Automacao {
    id: number;
    titulo: string;
    descricao: string;
    canais: Canal[];
    ativo: boolean;
}

interface NotificacaoModalProps {
    canal: Canal | null;
    onClose: () => void;
    segurados: Segurado[];
}

/* ------------------------------------------------------------------ */
/* Dados de exemplo (trocar pelos dados reais vindos do Inertia)      */
/* ------------------------------------------------------------------ */

const CLIENTES_MOCK: Segurado[] = [
    {
        id: 2,
        nome_completo: 'Heitor Spineli',
        email: 'heitorspineli85@gmail.com',
        celular_whatsapp: '(19)99722-1083',
        cpf_cnpj: '456.882.558.03',
        devedor: false,
    },
    {
        id: 3,
        nome_completo: 'Maria Souza',
        email: 'maria.souza@email.com',
        celular_whatsapp: '(19) 98123-4455',
        cpf_cnpj: '222.222.222-22',
        devedor: true,
    },
    {
        id: 4,
        nome_completo: 'Carlos Lima',
        email: 'carlos.lima@email.com',
        celular_whatsapp: '(19) 99001-3344',
        cpf_cnpj: '333.333.333-33',
        devedor: false,
    },
];

const HISTORICO_MOCK: NotificacaoHistorico[] = [
    {
        id: 1,
        tipo: 'Lembrete de vencimento',
        destinatario: 'João Pereira',
        canal: 'whatsapp',
        mensagem: 'Sua parcela vence em 3 dias.',
        dataEnvio: '12/08/2026 09:12',
        status: 'enviado',
    },
    {
        id: 2,
        tipo: 'Cobrança em atraso',
        destinatario: 'Maria Souza',
        canal: 'email',
        mensagem: 'Identificamos um pagamento em atraso.',
        dataEnvio: '12/08/2026 08:47',
        status: 'falha',
    },
    {
        id: 3,
        tipo: 'Renovação de apólice',
        destinatario: 'Carlos Lima',
        canal: 'email',
        mensagem: 'Sua apólice vence em 15 dias.',
        dataEnvio: '11/08/2026 17:30',
        status: 'enviado',
    },
];

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

/* ------------------------------------------------------------------ */
/* Configuração visual de status e canal                              */
/* ------------------------------------------------------------------ */

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

/* ------------------------------------------------------------------ */
/* Toggle simples (sem depender de componente externo)                */
/* ------------------------------------------------------------------ */

function Toggle({ ativo, onChange }: { ativo: boolean; onChange: () => void }) {
    return (
        <button
            onClick={onChange}
            aria-pressed={ativo}
            className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
                ativo ? 'bg-emerald-500' : 'bg-muted'
            }`}
        >
            <span
                className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                    ativo ? 'translate-x-5' : 'translate-x-0'
                }`}
            />
        </button>
    );
}

/* ------------------------------------------------------------------ */
/* Componente principal                                               */
/* ------------------------------------------------------------------ */

export default function Notificacoes() {
    const [aba, setAba] = useState<'historico' | 'automacoes'>('historico');
    const [filtroCanal, setFiltroCanal] = useState('Todos');
    const [filtroStatus, setFiltroStatus] = useState('Todos');
    const [automacoes, setAutomacoes] = useState(AUTOMACOES_MOCK);

    const [modalCanal, setModalCanal] = useState<Canal | null>(null);
    const [busca, setBusca] = useState('');
    const [selecionados, setSelecionados] = useState<number[]>([]);
    const [mensagem, setMensagem] = useState('');

    const totalHoje = 10;
    const totalEnviados = 20;
    const totalPendentes = 30;
    const totalFalhas = 7;

    const historicoFiltrado = useMemo(() => {
        return HISTORICO_MOCK.filter((item) => {
            const passaCanal =
                filtroCanal === 'Todos' ||
                CANAL_CONFIG[item.canal].label === filtroCanal;
            const passaStatus =
                filtroStatus === 'Todos' ||
                STATUS_CONFIG[item.status].label === filtroStatus;
            return passaCanal && passaStatus;
        });
    }, [filtroCanal, filtroStatus]);

    const abrirModal = (canal: Canal) => {
        setModalCanal(canal);
        setSelecionados([]);
        setMensagem('');
        setBusca('');
    };

    const fecharModal = () => setModalCanal(null);

    const alternarAutomacao = (id: number) => {
        setAutomacoes((prev) =>
            prev.map((a) => (a.id === id ? { ...a, ativo: !a.ativo } : a)),
        );
    };

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
                        >
                            <Settings className="mr-2 size-4" />
                            Configurar
                        </Button>
                        <Button
                            onClick={() => abrirModal('email')}
                            className="h-11 rounded-xl bg-emerald-500 px-5 font-bold text-white shadow-lg shadow-emerald-500/20 transition-all hover:bg-emerald-600 active:scale-[0.98]"
                        >
                            <Send className="mr-2 size-4" />
                            Enviar Notificação
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

                {/* Cards de canal: Email / WhatsApp */}
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

                {/* Abas: Histórico / Automações */}
                <div className="inline-flex w-fit gap-1 rounded-xl border border-border/70 bg-card p-1">
                    <button
                        onClick={() => setAba('historico')}
                        className={`rounded-lg px-4 py-2 text-sm font-bold transition-colors ${
                            aba === 'historico'
                                ? 'bg-emerald-500 text-white shadow'
                                : 'text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        Histórico
                    </button>
                    <button
                        onClick={() => setAba('automacoes')}
                        className={`rounded-lg px-4 py-2 text-sm font-bold transition-colors ${
                            aba === 'automacoes'
                                ? 'bg-emerald-500 text-white shadow'
                                : 'text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        Automações
                    </button>
                </div>

                {aba === 'historico' ? (
                    <div className="rounded-2xl border border-border/70 bg-card shadow-sm">
                        <div className="flex flex-col gap-4 border-b border-border/70 p-5 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <h2 className="text-base font-bold tracking-tight text-foreground">
                                    Histórico de Notificações
                                </h2>
                                <p className="text-xs text-muted-foreground">
                                    {historicoFiltrado.length} notificação(ões)
                                    encontrada(s)
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="relative">
                                    <select
                                        value={filtroCanal}
                                        onChange={(e) =>
                                            setFiltroCanal(e.target.value)
                                        }
                                        className="h-10 appearance-none rounded-xl border border-border/70 bg-background pr-8 pl-3 text-sm font-semibold text-foreground focus:ring-2 focus:ring-emerald-500/30 focus:outline-none"
                                    >
                                        <option>Todos</option>
                                        <option>E-mail</option>
                                        <option>WhatsApp</option>
                                    </select>
                                    <ChevronDown className="pointer-events-none absolute top-1/2 right-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
                                </div>
                                <div className="relative">
                                    <select
                                        value={filtroStatus}
                                        onChange={(e) =>
                                            setFiltroStatus(e.target.value)
                                        }
                                        className="h-10 appearance-none rounded-xl border border-border/70 bg-background pr-8 pl-3 text-sm font-semibold text-foreground focus:ring-2 focus:ring-emerald-500/30 focus:outline-none"
                                    >
                                        <option>Todos</option>
                                        <option>Enviado</option>
                                        <option>Pendente</option>
                                        <option>Falha</option>
                                    </select>
                                    <ChevronDown className="pointer-events-none absolute top-1/2 right-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
                                </div>
                            </div>
                        </div>

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
                                    {historicoFiltrado.map((item) => {
                                        const CanalIcon =
                                            CANAL_CONFIG[item.canal].icon;
                                        return (
                                            <tr
                                                key={item.id}
                                                className="border-b border-border/40 transition-colors last:border-0 hover:bg-muted/40"
                                            >
                                                <td className="px-5 py-3.5 font-semibold text-foreground">
                                                    {item.tipo}
                                                </td>
                                                <td className="px-5 py-3.5 text-muted-foreground">
                                                    {item.destinatario}
                                                </td>
                                                <td className="px-5 py-3.5">
                                                    <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                                                        <CanalIcon className="size-3.5" />
                                                        {
                                                            CANAL_CONFIG[
                                                                item.canal
                                                            ].label
                                                        }
                                                    </span>
                                                </td>
                                                <td className="max-w-[220px] truncate px-5 py-3.5 text-muted-foreground">
                                                    {item.mensagem}
                                                </td>
                                                <td className="px-5 py-3.5 text-muted-foreground">
                                                    {item.dataEnvio}
                                                </td>
                                                <td className="px-5 py-3.5">
                                                    <span
                                                        className={`rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${STATUS_CONFIG[item.status].badge}`}
                                                    >
                                                        {
                                                            STATUS_CONFIG[
                                                                item.status
                                                            ].label
                                                        }
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}

                                    {historicoFiltrado.length === 0 && (
                                        <tr>
                                            <td
                                                colSpan={6}
                                                className="px-5 py-10 text-center text-sm text-muted-foreground"
                                            >
                                                Nenhuma notificação encontrada
                                                para esse filtro.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
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
                                        className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                                            automacao.ativo
                                                ? 'bg-emerald-500/10 text-emerald-600'
                                                : 'bg-muted text-muted-foreground'
                                        }`}
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
                segurados={CLIENTES_MOCK}
            />
        </>
    );
}
