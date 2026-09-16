import { useForm, router } from '@inertiajs/react';
import {
    AlertTriangle,
    Building2,
    Check,
    ChevronRight,
    FileText,
    Pencil,
    Plus,
    Shield,
    Trash2,
    X,
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

type Modo = 'visualizar' | 'editar' | 'excluir';

interface RamoExistente {
    id: number;
    nome_ramo: string;
    categoria: string;
}

// Categoria decide quais dados extras a apólice desse ramo vai exigir no
// cadastro (placa/chassi para veículo, endereço do imóvel para residencial)
// — mesma lista usada no cadastro inicial da seguradora.
const CATEGORIAS_RAMO = [
    { value: 'veiculo', label: 'Veículo (auto/moto)' },
    { value: 'residencial', label: 'Residencial' },
    { value: 'vida', label: 'Vida' },
    { value: 'empresarial', label: 'Empresarial' },
    { value: 'outro', label: 'Outro' },
];

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
    });

    // Estado da linha de ramo em edição inline (null = nenhuma em edição).
    const [editandoRamoId, setEditandoRamoId] = useState<number | null>(null);
    const [nomeRamoEditando, setNomeRamoEditando] = useState('');
    const [categoriaRamoEditando, setCategoriaRamoEditando] = useState('');

    // Campos do formulário de "adicionar novo ramo".
    const [novoNomeRamo, setNovoNomeRamo] = useState('');
    const [novaCategoriaRamo, setNovaCategoriaRamo] = useState('');

    const fechar = () => {
        setModo('visualizar');
        setEditandoRamoId(null);
        setOpen(false);
    };

    // Os toasts de sucesso não são mostrados aqui — o layout já mostra
    // automaticamente a partir da flash message do backend; duplicar com
    // toast.success aqui mostrava dois avisos a cada ação.
    const salvarEdicao = () => {
        if (!seguradora) {
            return;
        }

        put(`/seguradoras/${seguradora.id}`, {
            onSuccess: () => fechar(),
            onError: () => toast.error('Falha ao salvar. Verifique os campos.'),
        });
    };

    const confirmarExclusao = () => {
        if (!seguradora) {
            return;
        }

        router.delete(`/seguradoras/${seguradora.id}`, {
            onError: () =>
                toast.error('Erro ao excluir seguradora. Tente novamente.'),
            onFinish: () => fechar(),
        });
    };

    const adicionarRamo = () => {
        if (!seguradora) {
            return;
        }

        if (!novoNomeRamo.trim() || !novaCategoriaRamo) {
            toast.error('Preencha o nome e a categoria do ramo.');

            return;
        }

        router.post(
            '/ramos',
            {
                seguradora_id: seguradora.id,
                nome_ramo: novoNomeRamo.trim(),
                categoria: novaCategoriaRamo,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setNovoNomeRamo('');
                    setNovaCategoriaRamo('');
                },
                onError: (errors) =>
                    toast.error(errors.nome_ramo ?? 'Erro ao adicionar ramo.'),
            },
        );
    };

    const iniciarEdicaoRamo = (ramo: RamoExistente) => {
        setEditandoRamoId(ramo.id);
        setNomeRamoEditando(ramo.nome_ramo);
        setCategoriaRamoEditando(ramo.categoria);
    };

    const cancelarEdicaoRamo = () => {
        setEditandoRamoId(null);
    };

    const salvarEdicaoRamo = () => {
        if (editandoRamoId === null) {
            return;
        }

        if (!nomeRamoEditando.trim() || !categoriaRamoEditando) {
            toast.error('Preencha o nome e a categoria do ramo.');

            return;
        }

        router.put(
            `/ramos/${editandoRamoId}`,
            {
                nome_ramo: nomeRamoEditando.trim(),
                categoria: categoriaRamoEditando,
            },
            {
                preserveScroll: true,
                onSuccess: () => setEditandoRamoId(null),
                onError: (errors) =>
                    toast.error(errors.nome_ramo ?? 'Erro ao atualizar ramo.'),
            },
        );
    };

    const excluirRamo = (id: number) => {
        router.delete(`/ramos/${id}`, {
            preserveScroll: true,
            onError: () =>
                toast.error(
                    'Não foi possível excluir — verifique se não há apólices usando este ramo.',
                ),
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

                    {modo === 'editar' && (
                        <Section
                            icon={<FileText className="h-4 w-4" />}
                            title="Ramos de atuação"
                            description="Adicione, renomeie ou remova os ramos desta seguradora"
                        >
                            <div className="space-y-3">
                                {(seguradora?.ramos ?? []).map(
                                    (ramo: RamoExistente) =>
                                        editandoRamoId === ramo.id ? (
                                            <div
                                                key={ramo.id}
                                                className="flex flex-col gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-2.5 sm:flex-row"
                                            >
                                                <Input
                                                    value={nomeRamoEditando}
                                                    onChange={(e) =>
                                                        setNomeRamoEditando(
                                                            e.target.value,
                                                        )
                                                    }
                                                    className="h-9 flex-1 rounded-lg border border-border/70 bg-background px-3 text-sm"
                                                />
                                                <Select
                                                    value={
                                                        categoriaRamoEditando
                                                    }
                                                    onValueChange={
                                                        setCategoriaRamoEditando
                                                    }
                                                >
                                                    <SelectTrigger className="h-9 w-full rounded-lg border border-border/70 bg-background px-3 text-sm sm:w-44">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {CATEGORIAS_RAMO.map(
                                                            (categoria) => (
                                                                <SelectItem
                                                                    key={
                                                                        categoria.value
                                                                    }
                                                                    value={
                                                                        categoria.value
                                                                    }
                                                                >
                                                                    {
                                                                        categoria.label
                                                                    }
                                                                </SelectItem>
                                                            ),
                                                        )}
                                                    </SelectContent>
                                                </Select>
                                                <div className="flex shrink-0 items-center gap-1">
                                                    <button
                                                        type="button"
                                                        onClick={
                                                            salvarEdicaoRamo
                                                        }
                                                        className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500 text-white hover:bg-emerald-600"
                                                    >
                                                        <Check className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={
                                                            cancelarEdicaoRamo
                                                        }
                                                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-border/70 text-muted-foreground hover:bg-muted"
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div
                                                key={ramo.id}
                                                className="flex items-center justify-between rounded-xl border border-border/70 bg-background px-3.5 py-2 shadow-sm"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-medium">
                                                        {ramo.nome_ramo}
                                                    </span>
                                                    <span className="rounded-md bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-600">
                                                        {
                                                            CATEGORIAS_RAMO.find(
                                                                (c) =>
                                                                    c.value ===
                                                                    ramo.categoria,
                                                            )?.label
                                                        }
                                                    </span>
                                                </div>
                                                <div className="flex shrink-0 items-center gap-1">
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            iniciarEdicaoRamo(
                                                                ramo,
                                                            )
                                                        }
                                                        className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                                                    >
                                                        <Pencil className="h-3.5 w-3.5" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            excluirRamo(ramo.id)
                                                        }
                                                        className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-rose-500/10 hover:text-rose-500"
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </button>
                                                </div>
                                            </div>
                                        ),
                                )}

                                {(seguradora?.ramos ?? []).length === 0 && (
                                    <p className="text-xs text-muted-foreground italic">
                                        Nenhum ramo cadastrado ainda.
                                    </p>
                                )}

                                <div className="flex flex-col gap-2 border-t border-border/70 pt-3 sm:flex-row">
                                    <Input
                                        value={novoNomeRamo}
                                        onChange={(e) =>
                                            setNovoNomeRamo(e.target.value)
                                        }
                                        placeholder="Ex: Automóvel, Vida, Residencial..."
                                        className="h-10 flex-1 rounded-xl border border-border/70 bg-background px-3 text-sm"
                                    />
                                    <Select
                                        value={novaCategoriaRamo}
                                        onValueChange={setNovaCategoriaRamo}
                                    >
                                        <SelectTrigger className="h-10 w-full rounded-xl border border-border/70 bg-background px-3 text-sm sm:w-44">
                                            <SelectValue placeholder="Categoria" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {CATEGORIAS_RAMO.map(
                                                (categoria) => (
                                                    <SelectItem
                                                        key={categoria.value}
                                                        value={categoria.value}
                                                    >
                                                        {categoria.label}
                                                    </SelectItem>
                                                ),
                                            )}
                                        </SelectContent>
                                    </Select>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={adicionarRamo}
                                        className="h-10 shrink-0 rounded-xl border-border/70 px-4 hover:border-emerald-500/40 hover:bg-emerald-500/10 hover:text-emerald-600"
                                    >
                                        <Plus className="h-4 w-4" />
                                    </Button>
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
