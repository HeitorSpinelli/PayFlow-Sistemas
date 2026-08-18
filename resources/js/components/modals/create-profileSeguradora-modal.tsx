import { useForm, router } from '@inertiajs/react';
import {
    AlertTriangle,
    Building2,
    ChevronRight,
    FileText,
    Mail,
    Pencil,
    Shield,
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

export default function SeguradoraProfileModal({
    open,
    setOpen,
    seguradora,
}: any) {
    const [modo, setModo] = useState<Modo>('visualizar');

    const { data, setData, put, processing } = useForm({
        nome_fantasia: seguradora?.nome_fantasia ?? '',
        razao_social: seguradora?.razao_social ?? '',
        cnpj: seguradora?.cnpj ?? '',
        email_suporte: seguradora?.email_suporte ?? '',
        nome_ramo: seguradora?.nome_ramo ?? '',
    });

    const fechar = () => {
        setModo('visualizar');
        setOpen(false);
    };

    const salvarEdicao = () => {
        if (!seguradora) return;
        put(`/seguradoras/${seguradora.id}`, {
            onSuccess: () => {
                toast.success('Seguradora atualizada com sucesso!');
                fechar();
            },
            onError: () => toast.error('Falha ao salvar. Verifique os campos.'),
        });
    };

    const confirmarExclusao = () => {
        if (!seguradora) return;
        router.delete(`/seguradoras/${seguradora.id}`, {
            onSuccess: () => toast.success('Seguradora excluída com sucesso!'),
            onError: () =>
                toast.error('Erro ao excluir seguradora. Tente novamente.'),
            onFinish: () => fechar(),
        });
    };

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
                            <Building2 className="h-5 w-5" />
                        </div>
                        <div>
                            <div className="mb-1 flex items-center gap-1.5 text-[10px] font-bold tracking-[0.16em] text-emerald-600 uppercase">
                                <span>Seguradoras</span>
                                <ChevronRight className="h-3 w-3" />
                                <span>{tituloBreadcrumb}</span>
                            </div>
                            <DialogTitle className="text-xl font-bold tracking-tight sm:text-2xl">
                                {modo === 'visualizar' &&
                                    seguradora?.nome_fantasia}
                                {modo === 'editar' &&
                                    `Editar seguradora: ${seguradora?.nome_fantasia}`}
                                {modo === 'excluir' &&
                                    `Excluir seguradora: ${seguradora?.nome_fantasia}`}
                            </DialogTitle>
                        </div>
                    </div>
                </DialogHeader>

                <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-6 py-6 break-all sm:px-8">
                    {modo === 'visualizar' && (
                        <>
                            <Section
                                icon={<Shield className="h-4 w-4" />}
                                title="Informações principais"
                                description="Dados cadastrais da empresa"
                            >
                                <div className="grid gap-3 sm:grid-cols-2">
                                    <InfoField
                                        label="Nome fantasia"
                                        value={seguradora?.nome_fantasia}
                                    />
                                    <InfoField
                                        label="Razão social"
                                        value={seguradora?.razao_social}
                                    />
                                    <InfoField
                                        label="CNPJ"
                                        value={seguradora?.cnpj}
                                    />
                                    <InfoField
                                        label="E-mail de suporte"
                                        value={seguradora?.email_suporte}
                                    />
                                </div>
                            </Section>

                            <Section
                                icon={<FileText className="h-4 w-4" />}
                                title="Ramos atendidos"
                                description="Segmentos de atuação cadastrados"
                            >
                                <div className="flex flex-wrap gap-2">
                                    {seguradora?.ramos &&
                                    seguradora.ramos.length > 0 ? (
                                        seguradora.ramos.map(
                                            (ramo: any, index: number) => (
                                                <span
                                                    key={index}
                                                    className="inline-flex items-center rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-600"
                                                >
                                                    {ramo.nome_ramo || ramo}
                                                </span>
                                            ),
                                        )
                                    ) : (
                                        <p className="text-xs text-muted-foreground italic">
                                            Nenhum ramo cadastrado
                                        </p>
                                    )}
                                </div>
                            </Section>
                        </>
                    )}

                    {modo === 'editar' && (
                        <Section
                            icon={<Building2 className="h-4 w-4" />}
                            title="Editar dados"
                            description="Atualize as informações da seguradora"
                        >
                            <div className="space-y-4">
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="space-y-2">
                                        <label className="text-sm leading-none font-medium">
                                            Nome fantasia
                                        </label>
                                        <Input
                                            className="h-10 rounded-xl border border-border/70 bg-background px-3 py-2 text-sm shadow-sm transition-all hover:border-emerald-500/40 focus-visible:ring-4 focus-visible:ring-emerald-500/10 focus-visible:outline-none"
                                            value={data.nome_fantasia}
                                            onChange={(e) =>
                                                setData(
                                                    'nome_fantasia',
                                                    e.target.value,
                                                )
                                            }
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm leading-none font-medium">
                                            Razão social
                                        </label>
                                        <Input
                                            className="h-10 rounded-xl border border-border/70 bg-background px-3 py-2 text-sm shadow-sm transition-all hover:border-emerald-500/40 focus-visible:ring-4 focus-visible:ring-emerald-500/10 focus-visible:outline-none"
                                            value={data.razao_social}
                                            onChange={(e) =>
                                                setData(
                                                    'razao_social',
                                                    e.target.value,
                                                )
                                            }
                                        />
                                    </div>
                                </div>

                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="space-y-2">
                                        <label className="text-sm leading-none font-medium">
                                            CNPJ
                                        </label>
                                        <Input
                                            className="h-10 rounded-xl border border-border/70 bg-background px-3 py-2 text-sm shadow-sm transition-all hover:border-emerald-500/40 focus-visible:ring-4 focus-visible:ring-emerald-500/10 focus-visible:outline-none"
                                            value={data.cnpj}
                                            onChange={(e) =>
                                                setData('cnpj', e.target.value)
                                            }
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm leading-none font-medium">
                                            E-mail de suporte
                                        </label>
                                        <Input
                                            className="h-10 rounded-xl border border-border/70 bg-background px-3 py-2 text-sm shadow-sm transition-all hover:border-emerald-500/40 focus-visible:ring-4 focus-visible:ring-emerald-500/10 focus-visible:outline-none"
                                            type="email"
                                            value={data.email_suporte}
                                            onChange={(e) =>
                                                setData(
                                                    'email_suporte',
                                                    e.target.value,
                                                )
                                            }
                                        />
                                    </div>
                                </div>
                            </div>
                        </Section>
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
                                Tem certeza que deseja excluir a seguradora{' '}
                                <span className="font-semibold text-foreground">
                                    {seguradora?.nome_fantasia}
                                </span>
                                ? Todos os dados e vínculos associados serão
                                removidos permanentemente.
                            </p>
                        </Section>
                    )}
                </div>

                <div className="flex shrink-0 items-center justify-end gap-2 border-t border-border/70 bg-background px-6 py-4 sm:px-8">
                    {modo === 'visualizar' && (
                        <>
                            <Button
                                className="rounded-xl bg-emerald-500 text-white shadow-lg shadow-emerald-500/25 hover:bg-emerald-600"
                                onClick={() => setModo('editar')}
                            >
                                <Pencil className="mr-2 h-4 w-4" />
                                Editar
                            </Button>
                            <Button
                                variant="outline"
                                className="rounded-xl"
                                onClick={() => setModo('excluir')}
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Excluir
                            </Button>
                        </>
                    )}

                    {modo === 'editar' && (
                        <>
                            <Button
                                className="rounded-xl bg-emerald-500 text-white shadow-lg shadow-emerald-500/25 hover:bg-emerald-600"
                                onClick={salvarEdicao}
                                disabled={processing}
                            >
                                Salvar alterações
                            </Button>
                            <Button
                                variant="outline"
                                className="rounded-xl"
                                onClick={() => setModo('visualizar')}
                            >
                                Cancelar
                            </Button>
                        </>
                    )}

                    {modo === 'excluir' && (
                        <>
                            <Button
                                className="rounded-xl bg-rose-500 text-white shadow-lg shadow-rose-500/25 hover:bg-rose-600"
                                onClick={confirmarExclusao}
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Confirmar exclusão
                            </Button>
                            <Button
                                variant="outline"
                                className="rounded-xl"
                                onClick={() => setModo('visualizar')}
                            >
                                Cancelar
                            </Button>
                        </>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
