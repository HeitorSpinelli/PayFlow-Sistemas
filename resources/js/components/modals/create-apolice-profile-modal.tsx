import { useForm, router } from '@inertiajs/react';
import {
    AlertTriangle,
    Car,
    ChevronRight,
    CreditCard,
    FileText,
    Home,
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    formatarDataBR,
    formataCpfCnpj,
    aplicarMascaraCEP,
} from '@/utils/Masks';

type Modo = 'visualizar' | 'editar' | 'excluir';

const DADOS_VEICULO_INICIAL = {
    tipo_veiculo: '',
    placa: '',
    renavam: '',
    chassi: '',
    marca: '',
    modelo: '',
    ano_fabricacao: '',
    ano_modelo: '',
    cor: '',
    combustivel: '',
    uso: '',
    cep_pernoite: '',
    possui_rastreador: false,
    nome_condutor_principal: '',
    cpf_condutor_principal: '',
    data_nascimento_condutor_principal: '',
};

const DADOS_RESIDENCIA_INICIAL = {
    tipo_imovel: '',
    tipo_construcao: '',
    endereco_imovel: '',
    numero: '',
    complemento: '',
    bairro_imovel: '',
    cidade_imovel: '',
    estado_imovel: '',
    cep_imovel: '',
    area_construida_m2: '',
    ano_construcao: '',
    ocupacao: '',
    possui_sistema_seguranca: false,
};

// Mescla os dados atuais (se já existirem no banco) com os valores padrão —
// evita inputs "uncontrolled" quando a apólice ainda não tem esse registro.
function mapDadosVeiculo(apolice: any) {
    return { ...DADOS_VEICULO_INICIAL, ...(apolice?.dados_veiculo ?? {}) };
}

function mapDadosResidencia(apolice: any) {
    return {
        ...DADOS_RESIDENCIA_INICIAL,
        ...(apolice?.dados_residencia ?? {}),
    };
}

// Rótulos amigáveis para os valores brutos salvos no banco (modo visualizar)
const LABEL_TIPO_VEICULO: Record<string, string> = {
    carro: 'Carro',
    moto: 'Moto',
    caminhonete: 'Caminhonete',
    caminhao: 'Caminhão',
    outro: 'Outro',
};

const LABEL_COMBUSTIVEL: Record<string, string> = {
    gasolina: 'Gasolina',
    etanol: 'Etanol',
    flex: 'Flex',
    diesel: 'Diesel',
    eletrico: 'Elétrico',
    hibrido: 'Híbrido',
};

const LABEL_USO_VEICULO: Record<string, string> = {
    particular: 'Particular',
    comercial: 'Comercial',
    aplicativo: 'Motorista de aplicativo',
};

const LABEL_TIPO_IMOVEL: Record<string, string> = {
    casa: 'Casa',
    apartamento: 'Apartamento',
    sobrado: 'Sobrado',
    outro: 'Outro',
};

const LABEL_TIPO_CONSTRUCAO: Record<string, string> = {
    alvenaria: 'Alvenaria',
    madeira: 'Madeira',
    mista: 'Mista',
};

const LABEL_OCUPACAO: Record<string, string> = {
    residencia_habitual: 'Residência habitual',
    veraneio: 'Casa de veraneio',
    alugado: 'Alugado a terceiros',
    desocupado: 'Desocupado',
};

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

    const { data, setData, put, processing, errors } = useForm({
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
        veiculo: DADOS_VEICULO_INICIAL,
        residencia: DADOS_RESIDENCIA_INICIAL,
    });

    // Categoria do ramo selecionado NO FORMULÁRIO (pode ter mudado desde que
    // o modal abriu, se o usuário trocar o ramo em modo de edição).
    const categoriaRamoEmEdicao = ramos?.find(
        (ramo: any) => String(ramo.id) === String(data.ramo_id),
    )?.categoria;

    const atualizarVeiculo = (campo: string, valor: any) =>
        setData('veiculo', { ...data.veiculo, [campo]: valor });

    const atualizarResidencia = (campo: string, valor: any) =>
        setData('residencia', { ...data.residencia, [campo]: valor });

    // Erros de campos aninhados (ex: "veiculo.placa") chegam do Laravel como
    // chaves com ponto — não fazem parte do tipo do formulário, daí o cast.
    const err = errors as Record<string, string | undefined>;

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
                inicio_vigencia: apolice.inicio_vigencia
                    ? apolice.inicio_vigencia.split('T')[0]
                    : '',
                fim_vigencia: apolice.fim_vigencia
                    ? apolice.fim_vigencia.split('T')[0]
                    : '',
                status: apolice.status ?? '',
                observacoes: apolice.observacoes ?? '',
                veiculo: mapDadosVeiculo(apolice),
                residencia: mapDadosResidencia(apolice),
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [apolice, open]);

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
            <DialogContent className="!flex max-h-[92vh] flex-col gap-0 overflow-hidden rounded-2xl border-border/70 p-0 shadow-2xl sm:max-w-4xl">
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

                            {apolice.ramo_categoria === 'veiculo' &&
                                apolice.dados_veiculo && (
                                    <Section
                                        icon={<Car className="h-4 w-4" />}
                                        title="Dados do veículo"
                                        description="Identificação do bem segurado"
                                    >
                                        <div className="grid gap-3 sm:grid-cols-3">
                                            <InfoField
                                                label="Tipo"
                                                value={
                                                    LABEL_TIPO_VEICULO[
                                                        apolice.dados_veiculo
                                                            .tipo_veiculo
                                                    ]
                                                }
                                            />
                                            <InfoField
                                                label="Placa"
                                                value={
                                                    apolice.dados_veiculo.placa
                                                }
                                            />
                                            <InfoField
                                                label="Renavam"
                                                value={
                                                    apolice.dados_veiculo
                                                        .renavam
                                                }
                                            />
                                            <InfoField
                                                label="Marca / Modelo"
                                                value={`${apolice.dados_veiculo.marca ?? ''} ${apolice.dados_veiculo.modelo ?? ''}`}
                                            />
                                            <InfoField
                                                label="Ano Fab./Modelo"
                                                value={`${apolice.dados_veiculo.ano_fabricacao ?? '-'}/${apolice.dados_veiculo.ano_modelo ?? '-'}`}
                                            />
                                            <InfoField
                                                label="Cor"
                                                value={
                                                    apolice.dados_veiculo.cor
                                                }
                                            />
                                            <InfoField
                                                label="Combustível"
                                                value={
                                                    LABEL_COMBUSTIVEL[
                                                        apolice.dados_veiculo
                                                            .combustivel
                                                    ]
                                                }
                                            />
                                            <InfoField
                                                label="Uso"
                                                value={
                                                    LABEL_USO_VEICULO[
                                                        apolice.dados_veiculo
                                                            .uso
                                                    ]
                                                }
                                            />
                                            <InfoField
                                                label="Rastreador"
                                                value={
                                                    apolice.dados_veiculo
                                                        .possui_rastreador
                                                        ? 'Sim'
                                                        : 'Não'
                                                }
                                            />
                                            {apolice.dados_veiculo
                                                .nome_condutor_principal && (
                                                <InfoField
                                                    label="Condutor principal"
                                                    value={
                                                        apolice.dados_veiculo
                                                            .nome_condutor_principal
                                                    }
                                                />
                                            )}
                                        </div>
                                    </Section>
                                )}

                            {apolice.ramo_categoria === 'residencial' &&
                                apolice.dados_residencia && (
                                    <Section
                                        icon={<Home className="h-4 w-4" />}
                                        title="Dados do imóvel"
                                        description="Endereço e características do imóvel segurado"
                                    >
                                        <div className="grid gap-3 sm:grid-cols-3">
                                            <InfoField
                                                label="Tipo"
                                                value={
                                                    LABEL_TIPO_IMOVEL[
                                                        apolice.dados_residencia
                                                            .tipo_imovel
                                                    ]
                                                }
                                            />
                                            <InfoField
                                                label="Construção"
                                                value={
                                                    LABEL_TIPO_CONSTRUCAO[
                                                        apolice.dados_residencia
                                                            .tipo_construcao
                                                    ]
                                                }
                                            />
                                            <InfoField
                                                label="Área construída"
                                                value={
                                                    apolice.dados_residencia
                                                        .area_construida_m2
                                                        ? `${apolice.dados_residencia.area_construida_m2} m²`
                                                        : ''
                                                }
                                            />
                                            <div className="sm:col-span-3">
                                                <InfoField
                                                    label="Endereço do imóvel"
                                                    value={`${apolice.dados_residencia.endereco_imovel ?? ''}, ${apolice.dados_residencia.numero ?? ''} — ${apolice.dados_residencia.bairro_imovel ?? ''}, ${apolice.dados_residencia.cidade_imovel ?? ''}/${apolice.dados_residencia.estado_imovel ?? ''}`}
                                                />
                                            </div>
                                            <InfoField
                                                label="CEP"
                                                value={
                                                    apolice.dados_residencia
                                                        .cep_imovel
                                                }
                                            />
                                            <InfoField
                                                label="Ocupação"
                                                value={
                                                    LABEL_OCUPACAO[
                                                        apolice.dados_residencia
                                                            .ocupacao
                                                    ]
                                                }
                                            />
                                            <InfoField
                                                label="Sistema de segurança"
                                                value={
                                                    apolice.dados_residencia
                                                        .possui_sistema_seguranca
                                                        ? 'Sim'
                                                        : 'Não'
                                                }
                                            />
                                        </div>
                                    </Section>
                                )}

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
                                                value={data.valor_premio_total}
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
                                                value={data.quantidade_parcelas}
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

                            {categoriaRamoEmEdicao === 'veiculo' && (
                                <Section
                                    icon={<Car className="h-4 w-4" />}
                                    title="Dados do veículo"
                                    description="Identificação do bem segurado"
                                >
                                    <div className="space-y-4">
                                        <div className="grid gap-4 sm:grid-cols-3">
                                            <div className="space-y-2">
                                                <label className="text-sm leading-none font-medium">
                                                    Tipo
                                                </label>
                                                <Select
                                                    value={
                                                        data.veiculo
                                                            .tipo_veiculo
                                                    }
                                                    onValueChange={(v) =>
                                                        atualizarVeiculo(
                                                            'tipo_veiculo',
                                                            v,
                                                        )
                                                    }
                                                >
                                                    <SelectTrigger className="h-10 w-full rounded-xl border border-border/70 bg-background">
                                                        <SelectValue placeholder="Selecione" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {Object.entries(
                                                            LABEL_TIPO_VEICULO,
                                                        ).map(([v, label]) => (
                                                            <SelectItem
                                                                key={v}
                                                                value={v}
                                                            >
                                                                {label}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm leading-none font-medium">
                                                    Placa
                                                </label>
                                                <Input
                                                    maxLength={8}
                                                    value={data.veiculo.placa}
                                                    onChange={(e) =>
                                                        atualizarVeiculo(
                                                            'placa',
                                                            e.target.value.toUpperCase(),
                                                        )
                                                    }
                                                    className="h-10 rounded-xl border border-border/70 bg-background"
                                                />
                                                {err['veiculo.placa'] && (
                                                    <span className="text-xs font-medium text-rose-500">
                                                        {err['veiculo.placa']}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm leading-none font-medium">
                                                    Renavam
                                                </label>
                                                <Input
                                                    maxLength={11}
                                                    value={data.veiculo.renavam}
                                                    onChange={(e) =>
                                                        atualizarVeiculo(
                                                            'renavam',
                                                            e.target.value.replace(
                                                                /\D/g,
                                                                '',
                                                            ),
                                                        )
                                                    }
                                                    className="h-10 rounded-xl border border-border/70 bg-background"
                                                />
                                            </div>
                                        </div>

                                        <div className="grid gap-4 sm:grid-cols-3">
                                            <div className="space-y-2">
                                                <label className="text-sm leading-none font-medium">
                                                    Chassi
                                                </label>
                                                <Input
                                                    maxLength={17}
                                                    value={data.veiculo.chassi}
                                                    onChange={(e) =>
                                                        atualizarVeiculo(
                                                            'chassi',
                                                            e.target.value.toUpperCase(),
                                                        )
                                                    }
                                                    className="h-10 rounded-xl border border-border/70 bg-background"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm leading-none font-medium">
                                                    Marca
                                                </label>
                                                <Input
                                                    value={data.veiculo.marca}
                                                    onChange={(e) =>
                                                        atualizarVeiculo(
                                                            'marca',
                                                            e.target.value,
                                                        )
                                                    }
                                                    className="h-10 rounded-xl border border-border/70 bg-background"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm leading-none font-medium">
                                                    Modelo
                                                </label>
                                                <Input
                                                    value={data.veiculo.modelo}
                                                    onChange={(e) =>
                                                        atualizarVeiculo(
                                                            'modelo',
                                                            e.target.value,
                                                        )
                                                    }
                                                    className="h-10 rounded-xl border border-border/70 bg-background"
                                                />
                                            </div>
                                        </div>

                                        <div className="grid gap-4 sm:grid-cols-4">
                                            <div className="space-y-2">
                                                <label className="text-sm leading-none font-medium">
                                                    Ano Fab.
                                                </label>
                                                <Input
                                                    type="number"
                                                    value={
                                                        data.veiculo
                                                            .ano_fabricacao
                                                    }
                                                    onChange={(e) =>
                                                        atualizarVeiculo(
                                                            'ano_fabricacao',
                                                            e.target.value,
                                                        )
                                                    }
                                                    className="h-10 rounded-xl border border-border/70 bg-background"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm leading-none font-medium">
                                                    Ano Modelo
                                                </label>
                                                <Input
                                                    type="number"
                                                    value={
                                                        data.veiculo.ano_modelo
                                                    }
                                                    onChange={(e) =>
                                                        atualizarVeiculo(
                                                            'ano_modelo',
                                                            e.target.value,
                                                        )
                                                    }
                                                    className="h-10 rounded-xl border border-border/70 bg-background"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm leading-none font-medium">
                                                    Cor
                                                </label>
                                                <Input
                                                    value={data.veiculo.cor}
                                                    onChange={(e) =>
                                                        atualizarVeiculo(
                                                            'cor',
                                                            e.target.value,
                                                        )
                                                    }
                                                    className="h-10 rounded-xl border border-border/70 bg-background"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm leading-none font-medium">
                                                    Combustível
                                                </label>
                                                <Select
                                                    value={
                                                        data.veiculo.combustivel
                                                    }
                                                    onValueChange={(v) =>
                                                        atualizarVeiculo(
                                                            'combustivel',
                                                            v,
                                                        )
                                                    }
                                                >
                                                    <SelectTrigger className="h-10 w-full rounded-xl border border-border/70 bg-background">
                                                        <SelectValue placeholder="Selecione" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {Object.entries(
                                                            LABEL_COMBUSTIVEL,
                                                        ).map(([v, label]) => (
                                                            <SelectItem
                                                                key={v}
                                                                value={v}
                                                            >
                                                                {label}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>

                                        <div className="grid gap-4 sm:grid-cols-2">
                                            <div className="space-y-2">
                                                <label className="text-sm leading-none font-medium">
                                                    Uso do veículo
                                                </label>
                                                <Select
                                                    value={data.veiculo.uso}
                                                    onValueChange={(v) =>
                                                        atualizarVeiculo(
                                                            'uso',
                                                            v,
                                                        )
                                                    }
                                                >
                                                    <SelectTrigger className="h-10 w-full rounded-xl border border-border/70 bg-background">
                                                        <SelectValue placeholder="Selecione" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {Object.entries(
                                                            LABEL_USO_VEICULO,
                                                        ).map(([v, label]) => (
                                                            <SelectItem
                                                                key={v}
                                                                value={v}
                                                            >
                                                                {label}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm leading-none font-medium">
                                                    CEP de pernoite
                                                </label>
                                                <Input
                                                    value={
                                                        data.veiculo
                                                            .cep_pernoite
                                                    }
                                                    onChange={(e) =>
                                                        atualizarVeiculo(
                                                            'cep_pernoite',
                                                            aplicarMascaraCEP(
                                                                e.target.value,
                                                            ),
                                                        )
                                                    }
                                                    className="h-10 rounded-xl border border-border/70 bg-background"
                                                />
                                            </div>
                                        </div>

                                        <label className="flex items-center gap-2 text-sm font-medium">
                                            <input
                                                type="checkbox"
                                                checked={
                                                    data.veiculo
                                                        .possui_rastreador
                                                }
                                                onChange={(e) =>
                                                    atualizarVeiculo(
                                                        'possui_rastreador',
                                                        e.target.checked,
                                                    )
                                                }
                                                className="h-4 w-4 rounded border-border/80"
                                            />
                                            Veículo possui rastreador
                                        </label>

                                        <div className="grid gap-4 sm:grid-cols-2">
                                            <div className="space-y-2">
                                                <label className="text-sm leading-none font-medium">
                                                    Condutor principal
                                                </label>
                                                <Input
                                                    value={
                                                        data.veiculo
                                                            .nome_condutor_principal
                                                    }
                                                    onChange={(e) =>
                                                        atualizarVeiculo(
                                                            'nome_condutor_principal',
                                                            e.target.value,
                                                        )
                                                    }
                                                    className="h-10 rounded-xl border border-border/70 bg-background"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm leading-none font-medium">
                                                    CPF do condutor
                                                </label>
                                                <Input
                                                    value={
                                                        data.veiculo
                                                            .cpf_condutor_principal
                                                    }
                                                    onChange={(e) =>
                                                        atualizarVeiculo(
                                                            'cpf_condutor_principal',
                                                            formataCpfCnpj(
                                                                e.target.value,
                                                            ),
                                                        )
                                                    }
                                                    className="h-10 rounded-xl border border-border/70 bg-background"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </Section>
                            )}

                            {categoriaRamoEmEdicao === 'residencial' && (
                                <Section
                                    icon={<Home className="h-4 w-4" />}
                                    title="Dados do imóvel"
                                    description="Endereço e características do imóvel segurado"
                                >
                                    <div className="space-y-4">
                                        <div className="grid gap-4 sm:grid-cols-2">
                                            <div className="space-y-2">
                                                <label className="text-sm leading-none font-medium">
                                                    Tipo de imóvel
                                                </label>
                                                <Select
                                                    value={
                                                        data.residencia
                                                            .tipo_imovel
                                                    }
                                                    onValueChange={(v) =>
                                                        atualizarResidencia(
                                                            'tipo_imovel',
                                                            v,
                                                        )
                                                    }
                                                >
                                                    <SelectTrigger className="h-10 w-full rounded-xl border border-border/70 bg-background">
                                                        <SelectValue placeholder="Selecione" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {Object.entries(
                                                            LABEL_TIPO_IMOVEL,
                                                        ).map(([v, label]) => (
                                                            <SelectItem
                                                                key={v}
                                                                value={v}
                                                            >
                                                                {label}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm leading-none font-medium">
                                                    Tipo de construção
                                                </label>
                                                <Select
                                                    value={
                                                        data.residencia
                                                            .tipo_construcao
                                                    }
                                                    onValueChange={(v) =>
                                                        atualizarResidencia(
                                                            'tipo_construcao',
                                                            v,
                                                        )
                                                    }
                                                >
                                                    <SelectTrigger className="h-10 w-full rounded-xl border border-border/70 bg-background">
                                                        <SelectValue placeholder="Selecione" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {Object.entries(
                                                            LABEL_TIPO_CONSTRUCAO,
                                                        ).map(([v, label]) => (
                                                            <SelectItem
                                                                key={v}
                                                                value={v}
                                                            >
                                                                {label}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm leading-none font-medium">
                                                Endereço do imóvel
                                            </label>
                                            <Input
                                                value={
                                                    data.residencia
                                                        .endereco_imovel
                                                }
                                                onChange={(e) =>
                                                    atualizarResidencia(
                                                        'endereco_imovel',
                                                        e.target.value,
                                                    )
                                                }
                                                className="h-10 rounded-xl border border-border/70 bg-background"
                                            />
                                        </div>

                                        <div className="grid gap-4 sm:grid-cols-4">
                                            <div className="space-y-2">
                                                <label className="text-sm leading-none font-medium">
                                                    Número
                                                </label>
                                                <Input
                                                    value={
                                                        data.residencia.numero
                                                    }
                                                    onChange={(e) =>
                                                        atualizarResidencia(
                                                            'numero',
                                                            e.target.value,
                                                        )
                                                    }
                                                    className="h-10 rounded-xl border border-border/70 bg-background"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm leading-none font-medium">
                                                    Bairro
                                                </label>
                                                <Input
                                                    value={
                                                        data.residencia
                                                            .bairro_imovel
                                                    }
                                                    onChange={(e) =>
                                                        atualizarResidencia(
                                                            'bairro_imovel',
                                                            e.target.value,
                                                        )
                                                    }
                                                    className="h-10 rounded-xl border border-border/70 bg-background"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm leading-none font-medium">
                                                    Cidade
                                                </label>
                                                <Input
                                                    value={
                                                        data.residencia
                                                            .cidade_imovel
                                                    }
                                                    onChange={(e) =>
                                                        atualizarResidencia(
                                                            'cidade_imovel',
                                                            e.target.value,
                                                        )
                                                    }
                                                    className="h-10 rounded-xl border border-border/70 bg-background"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm leading-none font-medium">
                                                    UF
                                                </label>
                                                <Input
                                                    maxLength={2}
                                                    value={
                                                        data.residencia
                                                            .estado_imovel
                                                    }
                                                    onChange={(e) =>
                                                        atualizarResidencia(
                                                            'estado_imovel',
                                                            e.target.value.toUpperCase(),
                                                        )
                                                    }
                                                    className="h-10 rounded-xl border border-border/70 bg-background"
                                                />
                                            </div>
                                        </div>

                                        <div className="grid gap-4 sm:grid-cols-3">
                                            <div className="space-y-2">
                                                <label className="text-sm leading-none font-medium">
                                                    CEP
                                                </label>
                                                <Input
                                                    value={
                                                        data.residencia
                                                            .cep_imovel
                                                    }
                                                    onChange={(e) =>
                                                        atualizarResidencia(
                                                            'cep_imovel',
                                                            aplicarMascaraCEP(
                                                                e.target.value,
                                                            ),
                                                        )
                                                    }
                                                    className="h-10 rounded-xl border border-border/70 bg-background"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm leading-none font-medium">
                                                    Área construída (m²)
                                                </label>
                                                <Input
                                                    type="number"
                                                    value={
                                                        data.residencia
                                                            .area_construida_m2
                                                    }
                                                    onChange={(e) =>
                                                        atualizarResidencia(
                                                            'area_construida_m2',
                                                            e.target.value,
                                                        )
                                                    }
                                                    className="h-10 rounded-xl border border-border/70 bg-background"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm leading-none font-medium">
                                                    Ano de construção
                                                </label>
                                                <Input
                                                    type="number"
                                                    value={
                                                        data.residencia
                                                            .ano_construcao
                                                    }
                                                    onChange={(e) =>
                                                        atualizarResidencia(
                                                            'ano_construcao',
                                                            e.target.value,
                                                        )
                                                    }
                                                    className="h-10 rounded-xl border border-border/70 bg-background"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm leading-none font-medium">
                                                Ocupação do imóvel
                                            </label>
                                            <Select
                                                value={data.residencia.ocupacao}
                                                onValueChange={(v) =>
                                                    atualizarResidencia(
                                                        'ocupacao',
                                                        v,
                                                    )
                                                }
                                            >
                                                <SelectTrigger className="h-10 w-full rounded-xl border border-border/70 bg-background">
                                                    <SelectValue placeholder="Selecione" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {Object.entries(
                                                        LABEL_OCUPACAO,
                                                    ).map(([v, label]) => (
                                                        <SelectItem
                                                            key={v}
                                                            value={v}
                                                        >
                                                            {label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <label className="flex items-center gap-2 text-sm font-medium">
                                            <input
                                                type="checkbox"
                                                checked={
                                                    data.residencia
                                                        .possui_sistema_seguranca
                                                }
                                                onChange={(e) =>
                                                    atualizarResidencia(
                                                        'possui_sistema_seguranca',
                                                        e.target.checked,
                                                    )
                                                }
                                                className="h-4 w-4 rounded border-border/80"
                                            />
                                            Imóvel possui sistema de segurança
                                        </label>
                                    </div>
                                </Section>
                            )}

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
