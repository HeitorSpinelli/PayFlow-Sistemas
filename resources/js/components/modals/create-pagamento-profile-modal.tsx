import { router } from '@inertiajs/react';
import {
    AlertTriangle,
    ChevronRight,
    CreditCard,
    FileText,
    History,
    ScrollText,
    Trash2,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { formatarMoeda, formatarDataBR } from '@/utils/Masks';
type Modo = 'visualizar' | 'excluir';

function Section({ icon, title, description, children }: any) {
    return (
        <section className="rounded-2xl border border-border/70 bg-muted/[0.18] p-4 sm:p-5">
            <div className="mb-5 flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
                    {icon}
                </span>
                <div>
                    <h3 className="text-sm font-bold">{title}</h3>
                    <p className="text-xs text-muted-foreground">
                        {description}
                    </p>
                </div>
            </div>
            {children}
        </section>
    );
}

function InfoField({ label, value }: { label: string; value?: string }) {
    return (
        <div className="rounded-xl border border-border/70 bg-background px-3 py-2.5 shadow-sm">
            <p className="mb-1 text-[10px] font-bold tracking-[0.14em] text-muted-foreground uppercase">
                {label}
            </p>
            <p className="text-sm font-semibold text-foreground capitalize">
                {value || 'Não informado'}
            </p>
        </div>
    );
}

export default function PagamentoProfileModal({
    open,
    setOpen,
    pagamento,
    apolices,
}: any) {
    const [modo, setModo] = useState<Modo>('visualizar');
    const [apoliceSelecionada, setApoliceSelecionada] = useState('');

    // Começa mostrando a apólice do pagamento que foi clicado
    useEffect(() => {
        if (open) {
            setApoliceSelecionada(String(pagamento?.apolice_id ?? ''));
        }
    }, [open, pagamento?.apolice_id]);

    // Todas as apólices do cliente (inclusive as ainda não pagas ou a vencer), para o seletor
    const apolicesDoCliente = useMemo(() => {
        return (apolices ?? [])
            .filter(
                (a: any) =>
                    String(a.cliente_id) === String(pagamento.cliente_id),
            )
            .map((a: any) => ({
                id: String(a.id),
                numero: a.numero_apolice,
                quantidadeParcelas: a.quantidade_parcelas ?? null,
                parcelas: a.parcelas ?? [],
            }));
    }, [apolices, pagamento.cliente_id]);

    const apoliceAtual = apolicesDoCliente.find(
        (a: any) => a.id === apoliceSelecionada,
    );

    // Todas as parcelas da apólice selecionada — pagas, em aberto e a vencer
    const parcelasDaApoliceAtual = useMemo(() => {
        return [...(apoliceAtual?.parcelas ?? [])].sort(
            (a: any, b: any) => a.numero_parcela - b.numero_parcela,
        );
    }, [apoliceAtual]);

    const parcelasPagas = parcelasDaApoliceAtual.filter(
        (p: any) => p.status_pagamento === 'paga',
    ).length;

    // Próxima parcela pendente que ainda não venceu — só ela recebe o selo
    // "A vencer"; parcelas atrasadas viram "Atrasado" e as pendentes mais à
    // frente ficam neutras ("Em aberto")
    const proximaParcelaPendenteId = parcelasDaApoliceAtual.find(
        (p: any) => p.status_pagamento !== 'paga' && (p.dias_atraso ?? 0) === 0,
    )?.id;

    const fechar = () => {
        setModo('visualizar');
        setOpen(false);
    };

    const confirmarExclusao = () => {
        if (!pagamento) return; // ← proteção
        router.delete(`/pagamentos/${pagamento.id}`, {
            onSuccess: () => toast.success('Pagamento excluído com sucesso!'),
            onError: () =>
                toast.error('Erro ao excluir pagamento. Tente novamente.'),
            onFinish: () => fechar(),
        });
    };

    if (!pagamento) return null;

    const tituloBreadcrumb = modo === 'excluir' ? 'Excluir' : 'Detalhes';

    return (
        <Dialog open={open} onOpenChange={fechar}>
            <DialogContent className="!flex max-h-[92vh] flex-col gap-0 overflow-hidden rounded-2xl border-border/70 p-0 shadow-2xl sm:max-w-4xl">
                <DialogHeader className="relative shrink-0 overflow-hidden border-b border-border/70 bg-gradient-to-br from-emerald-500/[0.12] via-background to-background px-6 py-6 pr-12 sm:px-8">
                    <div className="absolute -top-12 -right-10 h-36 w-36 rounded-full bg-emerald-500/10 blur-2xl" />
                    <div className="relative flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-lg shadow-emerald-500/25">
                            <span className="text-lg font-bold">
                                {pagamento.cliente?.charAt(0)?.toUpperCase() ??
                                    '?'}
                            </span>
                        </div>
                        <div>
                            <div className="mb-1 flex items-center gap-1.5 text-[10px] font-bold tracking-[0.16em] text-emerald-600 uppercase">
                                <span>Pagamentos</span>
                                <ChevronRight className="h-3 w-3" />
                                <span>{tituloBreadcrumb}</span>
                            </div>
                            <DialogTitle className="text-xl font-bold tracking-tight sm:text-2xl">
                                {modo === 'visualizar' && pagamento.cliente}
                                {modo === 'excluir' && 'Excluir pagamento'}
                            </DialogTitle>
                        </div>
                    </div>
                    {modo === 'visualizar' && (
                        <div className="relative mt-3">
                            <span
                                className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-wide capitalize ${
                                    pagamento.status === 'confirmado'
                                        ? 'border border-emerald-500/20 bg-emerald-500/10 text-emerald-600'
                                        : 'border border-amber-500/20 bg-amber-500/10 text-amber-600'
                                }`}
                            >
                                {pagamento.status}
                            </span>
                        </div>
                    )}
                </DialogHeader>

                <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-6 py-6 sm:px-8">
                    {modo === 'visualizar' && (
                        <>
                            <Section
                                icon={<ScrollText className="h-4 w-4" />}
                                title="Apólice"
                                description="Escolha uma apólice do cliente para ver as parcelas pagas"
                            >
                                <div className="grid gap-3 sm:grid-cols-2">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold tracking-[0.14em] text-muted-foreground uppercase">
                                            Número
                                        </label>
                                        <Select
                                            value={apoliceSelecionada}
                                            onValueChange={
                                                setApoliceSelecionada
                                            }
                                        >
                                            <SelectTrigger className="h-10 w-full rounded-xl border border-border/70 bg-background px-3 text-sm shadow-sm">
                                                <SelectValue placeholder="Selecione" />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-xl border border-border/70 bg-popover text-popover-foreground shadow-md">
                                                {apolicesDoCliente.map(
                                                    (a: any) => (
                                                        <SelectItem
                                                            key={a.id}
                                                            value={a.id}
                                                            className="cursor-pointer rounded-lg"
                                                        >
                                                            {a.numero}
                                                        </SelectItem>
                                                    ),
                                                )}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <InfoField
                                        label="Parcelas pagas"
                                        value={
                                            apoliceAtual
                                                ? `${parcelasPagas} de ${apoliceAtual.quantidadeParcelas ?? '?'}`
                                                : ''
                                        }
                                    />
                                </div>
                            </Section>

                            <Section
                                icon={<CreditCard className="h-4 w-4" />}
                                title="Pagamento"
                                description="Valor e forma de recebimento"
                            >
                                <div className="grid gap-3 sm:grid-cols-2">
                                    <InfoField
                                        label="Valor"
                                        value={
                                            pagamento.valor
                                                ? `R$ ${formatarMoeda(pagamento.valor)}`
                                                : ''
                                        }
                                    />
                                    <InfoField
                                        label="Data do pagamento"
                                        value={formatarDataBR(
                                            pagamento.data_pagamento,
                                        )}
                                    />
                                    <div className="sm:col-span-2">
                                        <InfoField
                                            label="Forma de pagamento"
                                            value={pagamento.forma_pagamento}
                                        />
                                    </div>
                                </div>
                            </Section>

                            {pagamento.observacoes && (
                                <Section
                                    icon={<FileText className="h-4 w-4" />}
                                    title="Observações"
                                    description="Anotações sobre o pagamento"
                                >
                                    <p className="text-sm leading-relaxed text-foreground">
                                        {pagamento.observacoes}
                                    </p>
                                </Section>
                            )}

                            <Section
                                icon={<History className="h-4 w-4" />}
                                title="Parcelas da apólice"
                                description={
                                    apoliceAtual
                                        ? `${apoliceAtual.numero} — ${pagamento.cliente}`
                                        : pagamento.cliente
                                }
                            >
                                {parcelasDaApoliceAtual.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">
                                        Nenhuma parcela encontrada para essa
                                        apólice.
                                    </p>
                                ) : (
                                    <div className="overflow-hidden rounded-xl border border-border/70">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="border-b border-border/70 bg-background/60 text-xs font-bold tracking-wider text-muted-foreground uppercase">
                                                    <th className="px-3 py-2 text-left">
                                                        Parcela
                                                    </th>
                                                    <th className="px-3 py-2 text-left">
                                                        Valor
                                                    </th>
                                                    <th className="px-3 py-2 text-left">
                                                        Data
                                                    </th>
                                                    <th className="px-3 py-2 text-left">
                                                        Status
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {parcelasDaApoliceAtual.map(
                                                    (p: any) => {
                                                        const paga =
                                                            p.status_pagamento ===
                                                            'paga';
                                                        // dias_atraso vem do backend (Parcelas::diasEmAtraso) —
                                                        // só é > 0 pra parcela não paga cujo vencimento já passou
                                                        const atrasada =
                                                            !paga &&
                                                            (p.dias_atraso ??
                                                                0) > 0;
                                                        // só a próxima parcela pendente (a mais próxima de vencer) ganha o selo "A vencer"
                                                        const proximaAVencer =
                                                            !paga &&
                                                            !atrasada &&
                                                            p.id ===
                                                                proximaParcelaPendenteId;
                                                        const statusLabel = paga
                                                            ? 'Paga'
                                                            : atrasada
                                                              ? 'Atrasado'
                                                              : proximaAVencer
                                                                ? 'A vencer'
                                                                : 'Em aberto';
                                                        const destacada =
                                                            apoliceSelecionada ===
                                                                String(
                                                                    pagamento.apolice_id,
                                                                ) &&
                                                            p.numero_parcela ===
                                                                Number(
                                                                    pagamento.parcela,
                                                                );

                                                        return (
                                                            <tr
                                                                key={p.id}
                                                                className={`border-b border-border/70 last:border-b-0 ${
                                                                    destacada
                                                                        ? 'bg-emerald-500/10'
                                                                        : ''
                                                                }`}
                                                            >
                                                                <td className="px-3 py-2 text-foreground">
                                                                    {
                                                                        p.numero_parcela
                                                                    }
                                                                    ª
                                                                </td>
                                                                <td className="px-3 py-2 text-foreground">
                                                                    R${' '}
                                                                    {formatarMoeda(
                                                                        p.valor_parcela,
                                                                    )}
                                                                </td>
                                                                <td className="px-3 py-2 text-muted-foreground">
                                                                    {formatarDataBR(
                                                                        paga
                                                                            ? p.data_pagamento
                                                                            : p.data_vencimento,
                                                                    )}
                                                                </td>
                                                                <td className="px-3 py-2">
                                                                    <span
                                                                        className={`inline-flex rounded-lg px-2 py-0.5 text-xs font-semibold capitalize ${
                                                                            paga
                                                                                ? 'bg-emerald-500/10 text-emerald-600'
                                                                                : atrasada
                                                                                  ? 'bg-red-500/10 text-red-600'
                                                                                  : proximaAVencer
                                                                                    ? 'bg-amber-500/10 text-amber-600'
                                                                                    : 'bg-muted text-muted-foreground'
                                                                        }`}
                                                                    >
                                                                        {
                                                                            statusLabel
                                                                        }
                                                                    </span>
                                                                </td>
                                                            </tr>
                                                        );
                                                    },
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </Section>
                        </>
                    )}
                    {modo === 'excluir' && (
                        <Section
                            icon={
                                <AlertTriangle className="h-4 w-4 text-rose-500" />
                            }
                            title="Confirmar exclusão"
                            description="Esta ação não pode ser desfeita"
                        >
                            <p className="text-sm leading-relaxed text-muted-foreground">
                                O pagamento de{' '}
                                <span className="font-semibold text-foreground">
                                    {pagamento.cliente}
                                </span>{' '}
                                referente à apólice{' '}
                                <span className="font-semibold text-foreground">
                                    {pagamento.apolice}
                                </span>{' '}
                                ({pagamento.parcela}ª parcela) será removido
                                permanentemente do sistema.
                            </p>
                        </Section>
                    )}
                </div>

                <div className="flex shrink-0 items-center justify-between border-t border-border/70 bg-background px-6 py-4 sm:px-8">
                    {modo === 'visualizar' ? (
                        <Button
                            variant="outline"
                            className="rounded-xl border-rose-500/30 text-rose-500 hover:bg-rose-500/10 hover:text-rose-500"
                            onClick={() => setModo('excluir')}
                        >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Excluir
                        </Button>
                    ) : (
                        <div />
                    )}

                    <div className="ml-auto flex gap-2">
                        {modo === 'visualizar' && (
                            <Button
                                variant="outline"
                                className="rounded-xl"
                                onClick={fechar}
                            >
                                Fechar
                            </Button>
                        )}

                        {modo === 'excluir' && (
                            <>
                                <Button
                                    variant="outline"
                                    className="rounded-xl"
                                    onClick={() => setModo('visualizar')}
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
                            </>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
