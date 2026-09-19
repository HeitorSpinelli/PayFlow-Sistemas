import { ChevronDown, Download, ScrollText, UserRound } from 'lucide-react';
import { useMemo, useState } from 'react';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { formatarDataBR, formatarMoeda } from '@/utils/Masks';

interface ClienteSelecionado {
    id: number;
    nome: string;
}

interface PainelClientePagamentosProps {
    cliente: ClienteSelecionado | null;
    apolices: any[];
    apoliceIdInicial?: number | null;
}

export default function PainelClientePagamentos({
    cliente,
    apolices,
    apoliceIdInicial = null,
}: PainelClientePagamentosProps) {
    const apolicesDoCliente = useMemo(() => {
        if (!cliente) {
            return [];
        }

        return (apolices ?? []).filter(
            (a: any) => String(a.cliente_id) === String(cliente.id),
        );
    }, [apolices, cliente]);

    // Mesma regra usada em ApoliceService::contarClientesDevedores() (a
    // mesma que já alimenta o card "devedor(es)" do dashboard): inadimplente
    // é quem tem ao menos uma parcela não paga e já vencida em QUALQUER
    // apólice, não só na que estiver aberta no acordeão no momento.
    const inadimplente = useMemo(() => {
        return apolicesDoCliente.some((a: any) =>
            (a.parcelas ?? []).some(
                (p: any) =>
                    p.status_pagamento !== 'paga' && (p.dias_atraso ?? 0) > 0,
            ),
        );
    }, [apolicesDoCliente]);

    // O componente recebe key={cliente.id} de quem o usa (ver pagamentos.tsx)
    // exatamente para forçar essa remontagem: sem isso, trocar de cliente só
    // mudaria os props e esse useState inicial não rodaria de novo — o mesmo
    // tipo de dessincronia encontrado no modal antigo (a seção "Pagamento"
    // que nunca reagia à apólice escolhida no dropdown).
    const [apoliceAberta, setApoliceAberta] = useState<number | null>(
        apoliceIdInicial,
    );

    if (!cliente) {
        return (
            <div className="flex h-full min-h-[320px] flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border/70 bg-card/50 p-10 text-center lg:sticky lg:top-6">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
                    <UserRound className="size-6" />
                </span>
                <div>
                    <p className="text-sm font-semibold text-foreground">
                        Nenhum cliente selecionado
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                        Clique em um pagamento na lista para ver o cliente, o
                        status de pagamento e as apólices dele.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex max-h-[calc(100vh-14rem)] flex-col gap-5 rounded-2xl border border-border/70 bg-card p-5 shadow-sm sm:p-6 lg:sticky lg:top-6">
            <div className="flex items-center gap-5">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-lg shadow-emerald-500/25">
                    <span className="text-lg font-bold">
                        {cliente.nome?.charAt(0)?.toUpperCase() ?? '?'}
                    </span>
                </div>
                <div>
                    <p className="text-sm font-bold text-foreground">
                        {cliente.nome}
                    </p>
                    <span
                        className={`mt-1 inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-wide ${
                            inadimplente
                                ? 'border border-red-500/20 bg-red-500/10 text-red-600'
                                : 'border border-emerald-500/20 bg-emerald-500/10 text-emerald-600'
                        }`}
                    >
                        {inadimplente ? 'Inadimplente' : 'Em dia'}
                    </span>
                </div>
            </div>

            <div className="scroll-fina flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto pr-1">
                {apolicesDoCliente.length === 0 && (
                    <p className="py-6 text-center text-sm text-muted-foreground">
                        Este cliente não possui apólices cadastradas.
                    </p>
                )}

                {apolicesDoCliente.map((apolice: any) => {
                    const parcelas = [...(apolice.parcelas ?? [])].sort(
                        (a: any, b: any) => a.numero_parcela - b.numero_parcela,
                    );
                    const parcelasPagas = parcelas.filter(
                        (p: any) => p.status_pagamento === 'paga',
                    ).length;
                    // Só a próxima parcela pendente (a mais próxima de
                    // vencer) ganha o selo "A vencer"; as demais pendentes
                    // ficam neutras ("Em aberto") — mesma regra do modal antigo.
                    const proximaParcelaPendenteId = parcelas.find(
                        (p: any) =>
                            p.status_pagamento !== 'paga' &&
                            (p.dias_atraso ?? 0) === 0,
                    )?.id;
                    const isOpen = apoliceAberta === apolice.id;

                    return (
                        <Collapsible
                            key={apolice.id}
                            open={isOpen}
                            onOpenChange={(open) =>
                                setApoliceAberta(open ? apolice.id : null)
                            }
                        >
                            <div className="overflow-hidden rounded-xl border border-border/70">
                                <CollapsibleTrigger asChild>
                                    <button className="flex w-full items-center justify-between gap-3 bg-muted/[0.18] px-4 py-3 text-left">
                                        <div className="flex items-center gap-2.5">
                                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600">
                                                <ScrollText className="size-4" />
                                            </span>
                                            <div>
                                                <p className="text-sm font-bold text-foreground">
                                                    {apolice.numero_apolice}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {parcelasPagas} de{' '}
                                                    {apolice.quantidade_parcelas ??
                                                        parcelas.length}{' '}
                                                    parcelas pagas
                                                </p>
                                            </div>
                                        </div>
                                        <ChevronDown
                                            className={`size-4 shrink-0 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`}
                                        />
                                    </button>
                                </CollapsibleTrigger>
                                <CollapsibleContent>
                                    <div className="border-t border-border/70 p-3">
                                        {parcelas.length === 0 ? (
                                            <p className="py-3 text-center text-sm text-muted-foreground">
                                                Nenhuma parcela encontrada para
                                                essa apólice.
                                            </p>
                                        ) : (
                                            <div className="overflow-hidden rounded-lg border border-border/70">
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
                                                        {parcelas.map(
                                                            (p: any) => {
                                                                const paga =
                                                                    p.status_pagamento ===
                                                                    'paga';
                                                                const atrasada =
                                                                    !paga &&
                                                                    (p.dias_atraso ??
                                                                        0) > 0;
                                                                const proximaAVencer =
                                                                    !paga &&
                                                                    !atrasada &&
                                                                    p.id ===
                                                                        proximaParcelaPendenteId;
                                                                const statusLabel =
                                                                    paga
                                                                        ? 'Paga'
                                                                        : atrasada
                                                                          ? 'Atrasado'
                                                                          : proximaAVencer
                                                                            ? 'A vencer'
                                                                            : 'Em aberto';

                                                                return (
                                                                    <tr
                                                                        key={
                                                                            p.id
                                                                        }
                                                                        className="border-b border-border/70 last:border-b-0"
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

                                        <a
                                            href={`/pagamentos/apolice/${apolice.id}/exportar`}
                                            className="mt-3 inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-border/70 bg-background px-3.5 text-xs font-medium shadow-sm transition-all hover:border-emerald-500/40 hover:bg-muted/50"
                                        >
                                            <Download className="size-3.5 text-muted-foreground/60" />
                                            Exportar parcelas desta apólice
                                        </a>
                                    </div>
                                </CollapsibleContent>
                            </div>
                        </Collapsible>
                    );
                })}
            </div>
        </div>
    );
}
