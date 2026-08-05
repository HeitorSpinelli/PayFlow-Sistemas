import { useForm, router } from '@inertiajs/react';
import {
    AlertTriangle,
    ChevronRight,
    CreditCard,
    FileText,
    Pencil,
    ScrollText,
    Trash2,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

type Modo = 'visualizar' | 'editar' | 'excluir';

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
            <p className="text-sm font-semibold text-foreground">
                {value || 'Não informado'}
            </p>
        </div>
    );
}

export default function CreateApoliceProfileModal({
    open,
    setOpen,
    apolice,
    ramos,
}: any) {
    const [modo, setModo] = useState<Modo>('visualizar');

    const { data, setData, put, processing } = useForm({
        numero_apolice: '',
        cliente_id: '',
        seguradora_id: '',
        ramo_id: '',
        valor_premio_total: '',
        valor_cobertura: '',
        quantidade_parcelas: '',
        forma_pagamento: '',
        inicio_vigencia: '',
        fim_vigencia: '',
        status: '',
        observacoes: '',
    });

    // Atualiza o formulário sempre que uma nova apólice for selecionada ou o modal abrir
    useEffect(() => {
        if (apolice) {
            setData({
                numero_apolice: apolice.numero_apolice ?? '',
                cliente_id: apolice.cliente_id ?? '',
                seguradora_id: apolice.seguradora_id ?? '',
                ramo_id: apolice.ramo_id ?? '',
                valor_premio_total: apolice.valor_premio_total ?? '',
                valor_cobertura: apolice.valor_cobertura ?? '',
                quantidade_parcelas: apolice.quantidade_parcelas ?? '',
                forma_pagamento: apolice.forma_pagamento ?? '',
                inicio_vigencia: apolice.inicio_vigencia ?? '',
                fim_vigencia: apolice.fim_vigencia ?? '',
                status: apolice.status ?? '',
                observacoes: apolice.observacoes ?? '',
            });
        }
    }, [apolice, open]);

    const formatarDataBR = (dataString: string) => {
        if (!dataString) return '-';
        // Divide a string no 'T' para pegar apenas a parte da data (AAAA-MM-DD)
        const [ano, mes, dia] = dataString.split('T')[0].split('-');
        return `${dia}/${mes}/${ano}`;
    };

    const fechar = () => {
        setModo('visualizar');
        setOpen(false);
    };

    const salvarEdicao = () => {
        if (!apolice) return;
        put(`/apolices/${apolice.id}`, {
            onSuccess: () => {
                toast.success('Apólice atualizada com sucesso!');
                fechar();
            },
            onError: () => toast.error('Verifique os dados enviados.'),
        });
    };

    const confirmarExclusao = () => {
        if (!apolice) return;
        router.delete(`/apolices/${apolice.id}`, {
            onSuccess: () => toast.success('Apólice excluída com sucesso!'),
            onError: () => toast.error('Erro ao excluir apólice.'),
            onFinish: () => fechar(),
        });
    };

    if (!apolice) return null;

    const tituloBreadcrumb =
        modo === 'editar'
            ? 'Editar'
            : modo === 'excluir'
              ? 'Excluir'
              : 'Detalhes';

    return (
        <Dialog open={open} onOpenChange={fechar}>
            <DialogContent className="!flex max-h-[92vh] max-w-3xl flex-col gap-0 overflow-hidden rounded-2xl border-border/70 p-0 shadow-2xl">
                <DialogHeader className="relative shrink-0 overflow-hidden border-b border-border/70 bg-gradient-to-br from-emerald-500/[0.12] via-background to-background px-6 py-6 pr-12 sm:px-8">
                    <div className="absolute -top-12 -right-10 h-36 w-36 rounded-full bg-emerald-500/10 blur-2xl" />
                    <div className="relative flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-lg shadow-emerald-500/25">
                            <span className="text-lg font-bold">
                                {apolice.nome_completo
                                    ?.charAt(0)
                                    ?.toUpperCase() || 'A'}
                            </span>
                        </div>
                        <div>
                            <div className="mb-1 flex items-center gap-1.5 text-[10px] font-bold tracking-[0.16em] text-emerald-600 uppercase">
                                <span>Apólices</span>
                                <ChevronRight className="h-3 w-3" />
                                <span>{tituloBreadcrumb}</span>
                            </div>
                            <DialogTitle className="text-xl font-bold tracking-tight sm:text-2xl">
                                {modo === 'visualizar' &&
                                    `Apólice #${apolice.numero_apolice}`}
                                {modo === 'editar' &&
                                    `Editar apólice: #${apolice.numero_apolice}`}
                                {modo === 'excluir' &&
                                    `Excluir apólice: #${apolice.numero_apolice}`}
                            </DialogTitle>
                            <p className="text-xs text-muted-foreground">
                                Segurado: {apolice.nome_completo}
                            </p>
                        </div>
                    </div>
                    {apolice.status_vigencia && (
                        <div className="relative mt-3 flex items-center gap-2">
                            {apolice.status_vigencia === 'Vigente' && (
                                <span className="inline-block rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold tracking-wide text-emerald-600">
                                    Vigente
                                </span>
                            )}
                            {apolice.status_vigencia === 'Para Renovar' && (
                                <span className="inline-block animate-pulse rounded-full border border-rose-500/30 bg-rose-500/10 px-2.5 py-0.5 text-xs font-semibold tracking-wide text-rose-500">
                                    Para Renovar
                                </span>
                            )}
                        </div>
                    )}
                </DialogHeader>

                <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-6 py-6 sm:px-8">
                    {/* ── MODO VISUALIZAR ── */}
                    {modo === 'visualizar' && (
                        <>
                            <Section
                                icon={<ScrollText className="h-4 w-4" />}
                                title="Informações gerais"
                                description="Identificação da apólice"
                            >
                                <div className="grid gap-3 sm:grid-cols-2">
                                    <InfoField
                                        label="Ramo / Seguradora"
                                        value={`${apolice.nome_ramo ?? ''} / ${apolice.nome_fantasia ?? ''}`}
                                    />
                                    <InfoField
                                        label="Número da apólice"
                                        value={apolice.numero_apolice}
                                    />
                                </div>
                            </Section>

                            <Section
                                icon={<CreditCard className="h-4 w-4" />}
                                title="Valores e parcelas"
                                description="Condições financeiras"
                            >
                                <div className="grid gap-3 sm:grid-cols-3">
                                    <InfoField
                                        label="Prêmio total"
                                        value={
                                            apolice.valor_premio_total
                                                ? `R$ ${apolice.valor_premio_total}`
                                                : ''
                                        }
                                    />
                                    <InfoField
                                        label="Cobertura"
                                        value={
                                            apolice.valor_cobertura
                                                ? `R$ ${apolice.valor_cobertura}`
                                                : ''
                                        }
                                    />
                                    <InfoField
                                        label="Parcelas / Forma"
                                        value={
                                            apolice.quantidade_parcelas
                                                ? `${apolice.quantidade_parcelas}x (${apolice.forma_pagamento || 'N/I'})`
                                                : ''
                                        }
                                    />
                                </div>
                            </Section>

                            <Section
                                icon={<CreditCard className="h-4 w-4" />}
                                title="Vigência"
                                description="Período de cobertura"
                            >
                                <div className="grid gap-3 sm:grid-cols-2">
                                    <InfoField
                                        label="Início"
                                        value={formatarDataBR(
                                            apolice.inicio_vigencia,
                                        )}
                                    />
                                    <InfoField
                                        label="Fim"
                                        value={formatarDataBR(
                                            apolice.fim_vigencia,
                                        )}
                                    />
                                </div>
                            </Section>

                            {apolice.observacoes && (
                                <Section
                                    icon={<FileText className="h-4 w-4" />}
                                    title="Observações"
                                    description="Anotações sobre a apólice"
                                >
                                    <p className="text-sm leading-relaxed whitespace-pre-line text-foreground">
                                        {apolice.observacoes}
                                    </p>
                                </Section>
                            )}
                        </>
                    )}

                    {/* ── MODO EDITAR ── */}
                    {modo === 'editar' && (
                        <>
                            <Section
                                icon={<ScrollText className="h-4 w-4" />}
                                title="Informações gerais"
                                description="Identificação da apólice"
                            >
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="space-y-2">
                                        <label className="text-sm leading-none font-medium">
                                            Número da apólice
                                        </label>
                                        <Input
                                            value={data.numero_apolice}
                                            onChange={(e) =>
                                                setData(
                                                    'numero_apolice',
                                                    e.target.value,
                                                )
                                            }
                                            className="h-10 rounded-xl border border-border/70 bg-background px-3 py-2 text-sm shadow-sm transition-all hover:border-emerald-500/40 focus-visible:ring-4 focus-visible:ring-emerald-500/10 focus-visible:outline-none"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm leading-none font-medium">
                                            Ramo
                                        </label>
                                        <select
                                            value={data.ramo_id}
                                            onChange={(e) =>
                                                setData(
                                                    'ramo_id',
                                                    e.target.value,
                                                )
                                            }
                                            className="h-10 w-full rounded-xl border border-border/70 bg-background px-3 text-sm shadow-sm transition-all hover:border-emerald-500/40 focus-visible:ring-4 focus-visible:ring-emerald-500/10 focus-visible:outline-none"
                                        >
                                            <option value="">
                                                Selecione um ramo
                                            </option>
                                            {ramos?.map((ramo: any) => (
                                                <option
                                                    key={ramo.id}
                                                    value={ramo.id}
                                                >
                                                    {ramo.nome_ramo}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </Section>

                            <Section
                                icon={<CreditCard className="h-4 w-4" />}
                                title="Valores e pagamento"
                                description="Condições financeiras"
                            >
                                <div className="space-y-4">
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div className="space-y-2">
                                            <label className="text-sm leading-none font-medium">
                                                Valor do prêmio total
                                            </label>
                                            <Input
                                                value={
                                                    data.valor_premio_total
                                                }
                                                onChange={(e) =>
                                                    setData(
                                                        'valor_premio_total',
                                                        e.target.value,
                                                    )
                                                }
                                                type="number"
                                                className="h-10 rounded-xl border border-border/70 bg-background px-3 py-2 text-sm shadow-sm transition-all hover:border-emerald-500/40 focus-visible:ring-4 focus-visible:ring-emerald-500/10 focus-visible:outline-none"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm leading-none font-medium">
                                                Valor de cobertura
                                            </label>
                                            <Input
                                                value={data.valor_cobertura}
                                                onChange={(e) =>
                                                    setData(
                                                        'valor_cobertura',
                                                        e.target.value,
                                                    )
                                                }
                                                type="number"
                                                className="h-10 rounded-xl border border-border/70 bg-background px-3 py-2 text-sm shadow-sm transition-all hover:border-emerald-500/40 focus-visible:ring-4 focus-visible:ring-emerald-500/10 focus-visible:outline-none"
                                            />
                                        </div>
                                    </div>
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div className="space-y-2">
                                            <label className="text-sm leading-none font-medium">
                                                Quantidade de parcelas
                                            </label>
                                            <Input
                                                value={
                                                    data.quantidade_parcelas
                                                }
                                                onChange={(e) =>
                                                    setData(
                                                        'quantidade_parcelas',
                                                        e.target.value,
                                                    )
                                                }
                                                type="number"
                                                className="h-10 rounded-xl border border-border/70 bg-background px-3 py-2 text-sm shadow-sm transition-all hover:border-emerald-500/40 focus-visible:ring-4 focus-visible:ring-emerald-500/10 focus-visible:outline-none"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm leading-none font-medium">
                                                Forma de pagamento
                                            </label>
                                            <Input
                                                value={data.forma_pagamento}
                                                onChange={(e) =>
                                                    setData(
                                                        'forma_pagamento',
                                                        e.target.value,
                                                    )
                                                }
                                                className="h-10 rounded-xl border border-border/70 bg-background px-3 py-2 text-sm shadow-sm transition-all hover:border-emerald-500/40 focus-visible:ring-4 focus-visible:ring-emerald-500/10 focus-visible:outline-none"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </Section>

                            <Section
                                icon={<CreditCard className="h-4 w-4" />}
                                title="Vigência"
                                description="Período de cobertura"
                            >
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="space-y-2">
                                        <label className="text-sm leading-none font-medium">
                                            Início da vigência
                                        </label>
                                        <Input
                                            value={data.inicio_vigencia}
                                            onChange={(e) =>
                                                setData(
                                                    'inicio_vigencia',
                                                    e.target.value,
                                                )
                                            }
                                            type="date"
                                            className="h-10 rounded-xl border border-border/70 bg-background px-3 py-2 text-sm shadow-sm transition-all hover:border-emerald-500/40 focus-visible:ring-4 focus-visible:ring-emerald-500/10 focus-visible:outline-none"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm leading-none font-medium">
                                            Fim da vigência
                                        </label>
                                        <Input
                                            value={data.fim_vigencia}
                                            onChange={(e) =>
                                                setData(
                                                    'fim_vigencia',
                                                    e.target.value,
                                                )
                                            }
                                            type="date"
                                            className="h-10 rounded-xl border border-border/70 bg-background px-3 py-2 text-sm shadow-sm transition-all hover:border-emerald-500/40 focus-visible:ring-4 focus-visible:ring-emerald-500/10 focus-visible:outline-none"
                                        />
                                    </div>
                                </div>
                            </Section>

                            <Section
                                icon={<FileText className="h-4 w-4" />}
                                title="Observações"
                                description="Anotações sobre a apólice"
                            >
                                <textarea
                                    value={data.observacoes}
                                    onChange={(e) =>
                                        setData('observacoes', e.target.value)
                                    }
                                    className="min-h-24 w-full rounded-xl border border-border/70 bg-background px-3 py-2 text-sm shadow-sm transition-all hover:border-emerald-500/40 focus-visible:ring-4 focus-visible:ring-emerald-500/10 focus-visible:outline-none"
                                />
                            </Section>
                        </>
                    )}

                    {/* ── MODO EXCLUIR ── */}
                    {modo === 'excluir' && (
                        <Section
                            icon={
                                <AlertTriangle className="h-4 w-4 text-rose-500" />
                            }
                            title="Confirmar exclusão"
                            description="Esta ação não pode ser desfeita"
                        >
                            <p className="text-sm leading-relaxed text-muted-foreground">
                                A apólice de número{' '}
                                <span className="font-semibold text-foreground">
                                    {apolice.numero_apolice}
                                </span>{' '}
                                vinculada a{' '}
                                <span className="font-semibold text-foreground">
                                    {apolice.nome_completo}
                                </span>{' '}
                                será removida permanentemente.
                            </p>
                        </Section>
                    )}
                </div>

                <div className="flex shrink-0 items-center justify-end gap-2 border-t border-border/70 bg-background px-6 py-4 sm:px-8">
                    {modo === 'visualizar' && (
                        <>
                            <Button
                                variant="outline"
                                className="rounded-xl"
                                onClick={() => setModo('excluir')}
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Excluir
                            </Button>
                            <Button
                                className="rounded-xl bg-emerald-500 text-white shadow-lg shadow-emerald-500/25 hover:bg-emerald-600"
                                onClick={() => setModo('editar')}
                            >
                                <Pencil className="mr-2 h-4 w-4" />
                                Editar
                            </Button>
                        </>
                    )}

                    {modo === 'editar' && (
                        <>
                            <Button
                                variant="outline"
                                className="rounded-xl"
                                onClick={() => setModo('visualizar')}
                            >
                                Cancelar
                            </Button>
                            <Button
                                className="rounded-xl bg-emerald-500 text-white shadow-lg shadow-emerald-500/25 hover:bg-emerald-600"
                                onClick={salvarEdicao}
                                disabled={processing}
                            >
                                Salvar alterações
                            </Button>
                        </>
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
                                className="rounded-xl bg-rose-500 text-white shadow-lg shadow-rose-500/25 hover:bg-rose-600"
                                onClick={confirmarExclusao}
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Confirmar exclusão
                            </Button>
                        </>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
