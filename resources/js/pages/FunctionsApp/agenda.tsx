import { useMemo, useState } from 'react';
import { Head } from '@inertiajs/react';
import {
    AlertCircle,
    CalendarDays,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    Clock,
    DollarSign,
    Phone,
    X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

/* ------------------------------------------------------------------ */
/* Tipos                                                              */
/* ------------------------------------------------------------------ */

type StatusCobranca = 'pago' | 'pendente' | 'atrasado';

interface Cobranca {
    id: number;
    cliente_id: number | null;
    cliente_nome: string;
    apolice: string;
    ramo: string;
    telefone?: string | null;
    valor: number;
    data_vencimento: string; // formato 'YYYY-MM-DD'
    status: StatusCobranca;
    numero_parcela: number | null;
    total_parcelas: number | null;
}

interface Props {
    cobrancas?: Cobranca[];
}

/* ------------------------------------------------------------------ */
/* Helpers de calendário                                              */
/* ------------------------------------------------------------------ */

const NOMES_MES = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

function toKey(y: number, m: number, day: number) {
    return `${y}-${String(m + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function formatMoeda(valor: number) {
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function labelParcela(c: Cobranca) {
    if (!c.numero_parcela) {
        return null;
    }

    return c.total_parcelas
        ? `${c.numero_parcela}ª/${c.total_parcelas}ª Parcela`
        : `${c.numero_parcela}ª Parcela`;
}

const STATUS_CONFIG: Record<
    StatusCobranca,
    { label: string; dot: string; badge: string; text: string }
> = {
    pago: {
        label: 'Pago',
        dot: 'bg-emerald-500',
        badge: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
        text: 'text-emerald-600',
    },
    pendente: {
        label: 'A vencer',
        dot: 'bg-amber-500',
        badge: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
        text: 'text-amber-600',
    },
    atrasado: {
        label: 'Em atraso',
        dot: 'bg-red-500',
        badge: 'bg-red-500/10 text-red-600 border-red-500/20',
        text: 'text-red-600',
    },
};

/* ------------------------------------------------------------------ */
/* Componente principal                                               */
/* ------------------------------------------------------------------ */

export default function Agenda({ cobrancas }: Props) {
    const dados = useMemo(() => cobrancas ?? [], [cobrancas]);

    const hoje = new Date();
    const [dataAtual, setDataAtual] = useState(new Date(hoje.getFullYear(), hoje.getMonth(), 1));
    const [diaSelecionado, setDiaSelecionado] = useState<string | null>(null);

    const ano = dataAtual.getFullYear();
    const mes = dataAtual.getMonth();

    // Agrupa as cobranças por dia (YYYY-MM-DD)
    const cobrancasPorDia = useMemo(() => {
        const mapa = new Map<string, Cobranca[]>();
        for (const c of dados) {
            const lista = mapa.get(c.data_vencimento) ?? [];
            lista.push(c);
            mapa.set(c.data_vencimento, lista);
        }
        return mapa;
    }, [dados]);

    // Monta a grade de 42 células (6 semanas) considerando padding do mês anterior/seguinte
    const celulas = useMemo(() => {
        const primeiroDiaSemana = new Date(ano, mes, 1).getDay();
        const totalDiasMes = new Date(ano, mes + 1, 0).getDate();
        const diasMesAnterior = new Date(ano, mes, 0).getDate();

        const lista: { dia: number; mesAtual: boolean; key: string }[] = [];

        for (let i = primeiroDiaSemana - 1; i >= 0; i--) {
            const dia = diasMesAnterior - i;
            const mesRef = mes === 0 ? 11 : mes - 1;
            const anoRef = mes === 0 ? ano - 1 : ano;
            lista.push({ dia, mesAtual: false, key: toKey(anoRef, mesRef, dia) });
        }
        for (let dia = 1; dia <= totalDiasMes; dia++) {
            lista.push({ dia, mesAtual: true, key: toKey(ano, mes, dia) });
        }
        while (lista.length % 7 !== 0 || lista.length < 42) {
            const dia = lista.length - (primeiroDiaSemana + totalDiasMes) + 1;
            const mesRef = mes === 11 ? 0 : mes + 1;
            const anoRef = mes === 11 ? ano + 1 : ano;
            lista.push({ dia, mesAtual: false, key: toKey(anoRef, mesRef, dia) });
        }
        return lista;
    }, [ano, mes]);

    // Resumo financeiro do mês visível
    const resumoMes = useMemo(() => {
        let aReceber = 0;
        let atrasado = 0;
        let recebido = 0;
        let qtdAtrasados = 0;

        for (const c of dados) {
            const [cy, cm] = c.data_vencimento.split('-').map(Number);
            if (cy !== ano || cm - 1 !== mes) continue;

            if (c.status === 'pago') recebido += c.valor;
            if (c.status === 'pendente') aReceber += c.valor;
            if (c.status === 'atrasado') {
                atrasado += c.valor;
                qtdAtrasados++;
            }
        }
        return { aReceber, atrasado, recebido, qtdAtrasados };
    }, [dados, ano, mes]);

    const mudarMes = (delta: number) => {
        setDataAtual(new Date(ano, mes + delta, 1));
    };

    const irParaHoje = () => {
        setDataAtual(new Date(hoje.getFullYear(), hoje.getMonth(), 1));
    };

    const chaveHoje = toKey(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
    const cobrancasDoDiaSelecionado = diaSelecionado
        ? (cobrancasPorDia.get(diaSelecionado) ?? [])
        : [];

    return (
        <>
            <Head title="Agenda de Pagamentos" />

            <div className="flex flex-col gap-6 p-6 sm:p-8">
                {/* Header da página */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <div className="mb-1 flex items-center gap-1.5 text-[10px] font-bold tracking-[0.16em] text-emerald-600 uppercase">
                            <span>Gestão</span>
                            <ChevronRight className="h-3 w-3" />
                            <span>Agenda</span>
                        </div>
                        <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
                            Agenda de Pagamentos
                        </h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Acompanhe quem vai pagar, quem já pagou e quem está devendo
                        </p>
                    </div>
                    <Button
                        onClick={irParaHoje}
                        variant="outline"
                        className="h-11 rounded-xl px-5 font-bold"
                    >
                        <CalendarDays className="mr-2 size-4" />
                        Hoje
                    </Button>
                </div>

                {/* Cards de resumo do mês */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div className="flex items-center gap-3 rounded-2xl border border-border/70 bg-card p-4 shadow-sm">
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600">
                            <Clock className="size-5" />
                        </span>
                        <div className="min-w-0">
                            <p className="text-[10px] font-bold tracking-[0.12em] text-muted-foreground uppercase">
                                A receber no mês
                            </p>
                            <p className="truncate text-lg font-bold text-foreground">
                                {formatMoeda(resumoMes.aReceber)}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 rounded-2xl border border-border/70 bg-card p-4 shadow-sm">
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-500/10 text-red-600">
                            <AlertCircle className="size-5" />
                        </span>
                        <div className="min-w-0">
                            <p className="text-[10px] font-bold tracking-[0.12em] text-muted-foreground uppercase">
                                Em atraso ({resumoMes.qtdAtrasados})
                            </p>
                            <p className="truncate text-lg font-bold text-red-600">
                                {formatMoeda(resumoMes.atrasado)}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 rounded-2xl border border-border/70 bg-card p-4 shadow-sm">
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
                            <CheckCircle2 className="size-5" />
                        </span>
                        <div className="min-w-0">
                            <p className="text-[10px] font-bold tracking-[0.12em] text-muted-foreground uppercase">
                                Recebido no mês
                            </p>
                            <p className="truncate text-lg font-bold text-foreground">
                                {formatMoeda(resumoMes.recebido)}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Calendário */}
                <div className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm sm:p-5">
                    {/* Navegação de mês */}
                    <div className="mb-4 flex items-center justify-between">
                        <h2 className="text-base font-bold tracking-tight text-foreground sm:text-lg">
                            {NOMES_MES[mes]} de {ano}
                        </h2>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => mudarMes(-1)}
                                className="flex h-9 w-9 items-center justify-center rounded-lg border border-border/70 text-muted-foreground transition-colors hover:bg-emerald-500/10 hover:text-emerald-600"
                                aria-label="Mês anterior"
                            >
                                <ChevronLeft className="size-4" />
                            </button>
                            <button
                                onClick={() => mudarMes(1)}
                                className="flex h-9 w-9 items-center justify-center rounded-lg border border-border/70 text-muted-foreground transition-colors hover:bg-emerald-500/10 hover:text-emerald-600"
                                aria-label="Próximo mês"
                            >
                                <ChevronRight className="size-4" />
                            </button>
                        </div>
                    </div>

                    {/* Cabeçalho dos dias da semana */}
                    <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
                        {DIAS_SEMANA.map((dia) => (
                            <div
                                key={dia}
                                className="pb-2 text-center text-[10px] font-bold tracking-[0.1em] text-muted-foreground uppercase"
                            >
                                {dia}
                            </div>
                        ))}
                    </div>

                    {/* Grade de dias */}
                    <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
                        {celulas.map((celula, idx) => {
                            const cobrancasDoDia = cobrancasPorDia.get(celula.key) ?? [];
                            const temAtraso = cobrancasDoDia.some((c) => c.status === 'atrasado');
                            const ehHoje = celula.key === chaveHoje;
                            const visiveis = cobrancasDoDia.slice(0, 2);
                            const restante = cobrancasDoDia.length - visiveis.length;

                            return (
                                <button
                                    key={`${celula.key}-${idx}`}
                                    disabled={cobrancasDoDia.length === 0}
                                    onClick={() => setDiaSelecionado(celula.key)}
                                    className={`flex min-h-[84px] flex-col items-start gap-1 rounded-xl border p-1.5 text-left transition-all sm:min-h-[104px] sm:p-2 ${
                                        celula.mesAtual
                                            ? 'border-border/70 bg-background'
                                            : 'border-transparent bg-muted/30 opacity-50'
                                    } ${
                                        cobrancasDoDia.length > 0
                                            ? 'cursor-pointer hover:border-emerald-500/40 hover:shadow-sm'
                                            : 'cursor-default'
                                    } ${temAtraso ? 'ring-1 ring-red-500/30' : ''}`}
                                >
                                    <span
                                        className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                                            ehHoje
                                                ? 'bg-emerald-500 text-white'
                                                : celula.mesAtual
                                                  ? 'text-foreground'
                                                  : 'text-muted-foreground'
                                        }`}
                                    >
                                        {celula.dia}
                                    </span>

                                    <div className="flex w-full flex-col gap-1">
                                        {visiveis.map((c) => (
                                            <span
                                                key={c.id}
                                                className={`flex items-center gap-1 truncate rounded-md px-1.5 py-0.5 text-[10px] font-semibold sm:text-[11px] ${STATUS_CONFIG[c.status].badge}`}
                                                title={`${c.cliente_nome}${labelParcela(c) ? ` — ${labelParcela(c)}` : ''} — ${STATUS_CONFIG[c.status].label}`}
                                            >
                                                <span
                                                    className={`size-1.5 shrink-0 rounded-full ${STATUS_CONFIG[c.status].dot}`}
                                                />
                                                <span className="truncate">
                                                    {c.cliente_nome.split(' ')[0]}
                                                </span>
                                                {c.numero_parcela && (
                                                    <span className="shrink-0 text-xs font-extrabold sm:text-sm">
                                                        · {c.numero_parcela}ª
                                                    </span>
                                                )}
                                            </span>
                                        ))}
                                        {restante > 0 && (
                                            <span className="pl-1 text-[10px] font-bold text-muted-foreground">
                                                +{restante} mais
                                            </span>
                                        )}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Legenda */}
                <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-border/70 bg-card px-4 py-3 text-xs font-semibold text-muted-foreground shadow-sm">
                    <span className="flex items-center gap-1.5">
                        <span className="size-2.5 rounded-full bg-emerald-500" />
                        Pago
                    </span>
                    <span className="flex items-center gap-1.5">
                        <span className="size-2.5 rounded-full bg-amber-500" />
                        A vencer
                    </span>
                    <span className="flex items-center gap-1.5">
                        <span className="size-2.5 rounded-full bg-red-500" />
                        Em atraso
                    </span>
                </div>
            </div>

            {/* Modal com o detalhe do dia selecionado */}
            {diaSelecionado && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
                    onClick={() => setDiaSelecionado(null)}
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        className="flex max-h-[80vh] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-border/70 bg-card shadow-xl"
                    >
                        <div className="flex items-center justify-between border-b border-border/70 px-5 py-4">
                            <div>
                                <p className="text-[10px] font-bold tracking-[0.14em] text-emerald-600 uppercase">
                                    Cobranças do dia
                                </p>
                                <h3 className="text-base font-bold text-foreground">
                                    {(() => {
                                        const [y, m, d] = diaSelecionado.split('-').map(Number);
                                        return `${d} de ${NOMES_MES[m - 1]} de ${y}`;
                                    })()}
                                </h3>
                            </div>
                            <button
                                onClick={() => setDiaSelecionado(null)}
                                className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted"
                                aria-label="Fechar"
                            >
                                <X className="size-4" />
                            </button>
                        </div>

                        <div className="flex flex-col gap-3 overflow-y-auto px-5 py-4">
                            {cobrancasDoDiaSelecionado.map((c) => (
                                <div
                                    key={c.id}
                                    className="flex flex-col gap-2 rounded-xl border border-border/70 p-3"
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-bold text-foreground">
                                                {c.cliente_nome}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                Apólice {c.apolice} · {c.ramo}
                                            </p>
                                        </div>
                                        <span
                                            className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold ${STATUS_CONFIG[c.status].badge}`}
                                        >
                                            {STATUS_CONFIG[c.status].label}
                                        </span>
                                    </div>

                                    {labelParcela(c) && (
                                        <span className="w-fit rounded-md bg-muted px-2.5 py-1 text-sm font-extrabold text-foreground">
                                            {labelParcela(c)}
                                        </span>
                                    )}

                                    <div className="flex items-center justify-between text-xs">
                                        <span className="flex items-center gap-1 font-bold text-foreground">
                                            <DollarSign className="size-3.5 text-muted-foreground" />
                                            {formatMoeda(c.valor)}
                                        </span>
                                        {c.telefone && (
                                            <span className="flex items-center gap-1 text-muted-foreground">
                                                <Phone className="size-3.5" />
                                                {c.telefone}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
