import { router } from '@inertiajs/react';
import {
    AlertTriangle,
    ChevronRight,
    CreditCard,
    FileText,
    ScrollText,
    Trash2,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
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
}: any) {
    const [modo, setModo] = useState<Modo>('visualizar');

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
            <DialogContent className="!flex max-h-[90vh] max-w-lg flex-col gap-0 overflow-hidden rounded-2xl border-border/70 p-0 shadow-2xl">
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
                                description="Referência da parcela paga"
                            >
                                <div className="grid gap-3 sm:grid-cols-2">
                                    <InfoField
                                        label="Número"
                                        value={pagamento.apolice}
                                    />
                                    <InfoField
                                        label="Parcela"
                                        value={
                                            pagamento.parcela
                                                ? `${pagamento.parcela}ª`
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
                                                ? `R$ ${pagamento.valor}`
                                                : ''
                                        }
                                    />
                                    <InfoField
                                        label="Data do pagamento"
                                        value={pagamento.data_pagamento}
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