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
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { useEffect, useState } from 'react';
import { useForm } from '@inertiajs/react';
import {
    ChevronRight,
    FileText,
    Shield,
    DollarSign,
    Calendar,
    Car,
    Home,
    HeartPulse,
    Building2,
    Plus,
    X,
} from 'lucide-react';

import { formataCpfCnpj, aplicarMascaraCEP } from '@/utils/Masks';

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

const DADOS_VIDA_INICIAL = {
    profissao: '',
    possui_atividade_profissional_risco: false,
    fumante: false,
    possui_doenca_preexistente: false,
    descricao_doencas: '',
    pratica_esporte_risco: false,
    qual_esporte: '',
    capital_segurado: '',
};

const BENEFICIARIO_INICIAL = {
    nome_completo: '',
    cpf: '',
    data_nascimento: '',
    parentesco: '',
    percentual_indenizacao: '',
};

const DADOS_EMPRESARIAL_INICIAL = {
    cnae_ou_atividade: '',
    numero_funcionarios: '',
    valor_patrimonio_segurado: '',
    faturamento_anual: '',
    possui_cobertura_incendio_basica: true,
    coberturas_adicionais: '',
    endereco_estabelecimento: '',
    numero_estabelecimento: '',
    bairro_estabelecimento: '',
    cidade_estabelecimento: '',
    estado_estabelecimento: '',
    cep_estabelecimento: '',
};

const PARENTESCOS = [
    { value: 'conjuge', label: 'Cônjuge' },
    { value: 'filho', label: 'Filho(a)' },
    { value: 'pai', label: 'Pai' },
    { value: 'mae', label: 'Mãe' },
    { value: 'irmao', label: 'Irmão(ã)' },
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

export default function CreateApoliceModal({
    open,
    setOpen,
    segurados = [],
    ramos = [],
    seguradoras = [],
}: any) {
    // Estados
    const [busca, setBusca] = useState('');
    const [mostrarLista, setMostrarLista] = useState(false);
    const [seguradoSelecionado, setSeguradoSelecionado] = useState<any>(null);

    // Formulário do Inertia
    const { data, errors, setData, post, reset, clearErrors, processing } =
        useForm({
            numero_apolice: '',
            cliente_id: '',
            seguradora_id: '',
            ramo_id: '',
            valor_premio_total: '',
            valor_cobertura: '',
            quantidade_parcelas: 1,
            forma_pagamento: '',
            inicio_vigencia: '',
            fim_vigencia: '',
            status: 'Ativa',
            observacoes: '',
            veiculo: DADOS_VEICULO_INICIAL,
            residencia: DADOS_RESIDENCIA_INICIAL,
            vida: DADOS_VIDA_INICIAL,
            beneficiarios: [BENEFICIARIO_INICIAL],
            empresarial: DADOS_EMPRESARIAL_INICIAL,
        });

    // Categoria do ramo selecionado — decide qual bloco de dados extras
    // mostramos (veículo, imóvel, vida, empresarial, ou nenhum — ex: ramos
    // sem categoria específica ainda).
    const ramoSelecionado = ramos.find(
        (ramo: any) => String(ramo.id) === String(data.ramo_id),
    );
    const categoriaRamo = ramoSelecionado?.categoria;

    const atualizarVeiculo = (campo: string, valor: any) =>
        setData('veiculo', { ...data.veiculo, [campo]: valor });

    const atualizarResidencia = (campo: string, valor: any) =>
        setData('residencia', { ...data.residencia, [campo]: valor });

    const atualizarVida = (campo: string, valor: any) =>
        setData('vida', { ...data.vida, [campo]: valor });

    const atualizarEmpresarial = (campo: string, valor: any) =>
        setData('empresarial', { ...data.empresarial, [campo]: valor });

    const atualizarBeneficiario = (
        index: number,
        campo: string,
        valor: any,
    ) => {
        const atualizados = data.beneficiarios.map(
            (beneficiario: any, i: number) =>
                i === index
                    ? { ...beneficiario, [campo]: valor }
                    : beneficiario,
        );
        setData('beneficiarios', atualizados);
    };

    const adicionarBeneficiario = () =>
        setData('beneficiarios', [...data.beneficiarios, BENEFICIARIO_INICIAL]);

    const removerBeneficiario = (index: number) =>
        setData(
            'beneficiarios',
            data.beneficiarios.filter((_: any, i: number) => i !== index),
        );

    // Soma dos percentuais informados — mostrado na tela como conferência
    // visual antes de enviar (a validação de verdade é feita no backend).
    const somaPercentuaisBeneficiarios = data.beneficiarios.reduce(
        (soma: number, b: any) =>
            soma + (parseFloat(b.percentual_indenizacao) || 0),
        0,
    );

    // Erros de campos aninhados (ex: "veiculo.placa") chegam do Laravel como
    // chaves com ponto — não fazem parte do tipo do formulário, daí o cast.
    const err = errors as Record<string, string | undefined>;

    useEffect(() => {
        if (!open) {
            reset();
            clearErrors();
            setBusca('');
            setSeguradoSelecionado(null);
            setMostrarLista(false);
        }
    }, [open]);

    // Filtra os segurados com base na busca (protegido contra cpf_cnpj nulo)
    const resultados = segurados.filter((segurado: any) => {
        const termoBusca = busca.toLowerCase();
        return (
            segurado.nome_completo?.toLowerCase().includes(termoBusca) ||
            segurado.cpf_cnpj?.includes(termoBusca)
        );
    });

    // Atualiza o estado da busca — se o texto não bater mais com o cliente
    // selecionado, invalida a seleção para não salvar o cliente errado
    const handleBuscaChange = (e: any) => {
        const valor = e.target.value;
        setBusca(valor);
        setMostrarLista(true);

        if (
            seguradoSelecionado &&
            valor !== seguradoSelecionado.nome_completo
        ) {
            setSeguradoSelecionado(null);
            setData('cliente_id', '');
        }
    };

    // Seleciona um segurado da lista
    const selecionarSegurado = (segurado: any) => {
        setSeguradoSelecionado(segurado);
        setData('cliente_id', segurado.id);
        setMostrarLista(false);
        setBusca(segurado.nome_completo);
    };

    // Troca de seguradora invalida o ramo já selecionado (ele pertence à seguradora anterior)
    const handleSeguradoraChange = (v: string) => {
        setData((prev: any) => ({
            ...prev,
            seguradora_id: v,
            ramo_id: '',
            veiculo: DADOS_VEICULO_INICIAL,
            residencia: DADOS_RESIDENCIA_INICIAL,
            vida: DADOS_VIDA_INICIAL,
            beneficiarios: [BENEFICIARIO_INICIAL],
            empresarial: DADOS_EMPRESARIAL_INICIAL,
        }));
    };

    // Troca de ramo limpa os dados extras do ramo anterior (ex: sair de um
    // ramo de veículo pra um residencial não deve arrastar placa/chassi)
    const handleRamoChange = (v: string) => {
        setData((prev: any) => ({
            ...prev,
            ramo_id: v,
            veiculo: DADOS_VEICULO_INICIAL,
            residencia: DADOS_RESIDENCIA_INICIAL,
            vida: DADOS_VIDA_INICIAL,
            beneficiarios: [BENEFICIARIO_INICIAL],
            empresarial: DADOS_EMPRESARIAL_INICIAL,
        }));
    };

    // Envia o formulário
    const salvarApolice = () => {
        post('/apolices', {
            onSuccess: () => {
                toast.success('Apólice salva com sucesso!', {
                    position: 'top-right',
                    style: {
                        color: '#e0ebe4',
                    },
                });
                setOpen(false);
            },
            onError: () => {
                toast.error('Falha ao salvar. Verifique os campos.', {
                    position: 'top-right',
                    style: {
                        color: '#b61212',
                    },
                });
            },
        });
    };

    return (
        <Dialog
            open={open}
            onOpenChange={(isOpen) => {
                if (!isOpen) {
                    reset();
                    clearErrors();
                    setBusca('');
                    setSeguradoSelecionado(null);
                    setMostrarLista(false);
                }
                setOpen(isOpen);
            }}
        >
            <DialogContent className="!flex max-h-[92vh] flex-col gap-0 overflow-hidden rounded-2xl border-border/70 p-0 shadow-2xl sm:max-w-4xl">
                {/* Header */}
                <DialogHeader className="relative shrink-0 overflow-hidden border-b border-border/70 bg-gradient-to-br from-emerald-500/[0.12] via-background to-background px-6 py-6 pr-12 sm:px-8">
                    <div className="absolute -top-12 -right-10 h-36 w-36 rounded-full bg-emerald-500/10 blur-2xl" />
                    <div className="relative flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-lg shadow-emerald-500/25">
                            <FileText className="h-5 w-5" />
                        </div>
                        <div>
                            <div className="mb-1 flex items-center gap-1.5 text-[10px] font-bold tracking-[0.16em] text-emerald-600 uppercase">
                                <span>Apólices</span>
                                <ChevronRight className="h-3 w-3" />
                                <span>Novo cadastro</span>
                            </div>
                            <DialogTitle className="text-xl font-bold tracking-tight sm:text-2xl">
                                Cadastrar Apólice
                            </DialogTitle>
                        </div>
                    </div>
                    <p className="relative mt-3 max-w-lg text-sm leading-relaxed text-muted-foreground">
                        Preencha os dados da apólice para cadastrá-la no
                        sistema.
                    </p>
                </DialogHeader>

                {/* Conteúdo com rolagem */}
                <div className="flex-1 overflow-y-auto px-6 py-6 sm:px-8">
                    <div className="space-y-6">
                        {/* Seção 1: Dados da Apólice */}
                        <Section
                            icon={<FileText className="h-4 w-4" />}
                            title="Dados da Apólice"
                            description="Informações principais do contrato e segurado"
                        >
                            <div className="space-y-4">
                                {/* Campo de busca de segurado */}
                                <div className="relative space-y-2">
                                    <label className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                        Cliente*
                                    </label>
                                    <Input
                                        type="text"
                                        placeholder="Buscar por nome, CPF ou CNPJ..."
                                        value={busca}
                                        onChange={handleBuscaChange}
                                        onFocus={() =>
                                            setMostrarLista(
                                                busca.trim().length > 0,
                                            )
                                        }
                                        onBlur={() =>
                                            setTimeout(
                                                () => setMostrarLista(false),
                                                150,
                                            )
                                        }
                                        className="h-11 rounded-xl border-border/80 bg-background"
                                    />

                                    {/* Lista de resultados */}
                                    {mostrarLista &&
                                        busca.trim().length > 0 &&
                                        resultados.length > 0 && (
                                            <div className="absolute z-50 mt-1 w-full overflow-hidden rounded-xl border border-border/80 bg-background shadow-lg">
                                                {resultados.map(
                                                    (segurado: any) => (
                                                        <div
                                                            key={segurado.id}
                                                            onMouseDown={() =>
                                                                selecionarSegurado(
                                                                    segurado,
                                                                )
                                                            }
                                                            className="flex cursor-pointer items-center justify-between gap-3 px-4 py-3 hover:bg-muted/50"
                                                        >
                                                            <span className="rounded-md bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-600">
                                                                {segurado.tipo_pessoa ===
                                                                'pf'
                                                                    ? 'CPF'
                                                                    : 'CNPJ'}
                                                            </span>
                                                            <span className="flex-1 text-sm font-medium">
                                                                {
                                                                    segurado.nome_completo
                                                                }
                                                            </span>
                                                            <span className="text-xs text-muted-foreground">
                                                                {segurado.cpf_cnpj
                                                                    ? formataCpfCnpj(
                                                                          segurado.cpf_cnpj,
                                                                      )
                                                                    : '-'}
                                                            </span>
                                                        </div>
                                                    ),
                                                )}
                                            </div>
                                        )}
                                    {errors.cliente_id && (
                                        <span className="text-xs font-medium text-rose-500">
                                            {errors.cliente_id}
                                        </span>
                                    )}
                                </div>

                                {/* Número da apólice */}
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                        Número da Apólice*
                                    </label>
                                    <Input
                                        type="text"
                                        placeholder="Ex: 401391234567"
                                        value={data.numero_apolice}
                                        onChange={(e) =>
                                            setData(
                                                'numero_apolice',
                                                e.target.value,
                                            )
                                        }
                                        className="h-11 rounded-xl border-border/80 bg-background"
                                    />
                                    {errors.numero_apolice && (
                                        <span className="text-xs font-medium text-rose-500">
                                            {errors.numero_apolice}
                                        </span>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                            Seguradora*
                                        </label>
                                        <Select
                                            value={
                                                data.seguradora_id
                                                    ? String(data.seguradora_id)
                                                    : ''
                                            }
                                            onValueChange={
                                                handleSeguradoraChange
                                            }
                                        >
                                            <SelectTrigger className="h-11 rounded-xl border-border/80 bg-background">
                                                <SelectValue placeholder="Selecione" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {seguradoras.map(
                                                    (seguradora: any) => (
                                                        <SelectItem
                                                            key={seguradora.id}
                                                            value={String(
                                                                seguradora.id,
                                                            )}
                                                        >
                                                            {
                                                                seguradora.nome_fantasia
                                                            }
                                                        </SelectItem>
                                                    ),
                                                )}
                                            </SelectContent>
                                        </Select>
                                        {errors.seguradora_id && (
                                            <span className="text-xs font-medium text-rose-500">
                                                {errors.seguradora_id}
                                            </span>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                            Ramo*
                                        </label>
                                        <Select
                                            value={
                                                data.ramo_id
                                                    ? String(data.ramo_id)
                                                    : ''
                                            }
                                            onValueChange={handleRamoChange}
                                            disabled={!data.seguradora_id}
                                        >
                                            <SelectTrigger className="h-11 rounded-xl border-border/80 bg-background">
                                                <SelectValue
                                                    placeholder={
                                                        data.seguradora_id
                                                            ? 'Selecione o ramo'
                                                            : 'Selecione a seguradora'
                                                    }
                                                />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {ramos
                                                    .filter(
                                                        (ramo: any) =>
                                                            String(
                                                                ramo.seguradora_id,
                                                            ) ===
                                                            String(
                                                                data.seguradora_id,
                                                            ),
                                                    )
                                                    .map((ramo: any) => (
                                                        <SelectItem
                                                            key={ramo.id}
                                                            value={String(
                                                                ramo.id,
                                                            )}
                                                        >
                                                            {ramo.nome_ramo}
                                                        </SelectItem>
                                                    ))}
                                            </SelectContent>
                                        </Select>
                                        {errors.ramo_id && (
                                            <span className="text-xs font-medium text-rose-500">
                                                {errors.ramo_id}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </Section>

                        {/* Seção condicional: Dados do Veículo (só ramos de veículo) */}
                        {categoriaRamo === 'veiculo' && (
                            <Section
                                icon={<Car className="h-4 w-4" />}
                                title="Dados do Veículo"
                                description="Identificação do bem e perfil de uso — exigidos pela seguradora"
                            >
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                                        <div className="space-y-2">
                                            <label className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                                Tipo*
                                            </label>
                                            <Select
                                                value={
                                                    data.veiculo.tipo_veiculo
                                                }
                                                onValueChange={(v) =>
                                                    atualizarVeiculo(
                                                        'tipo_veiculo',
                                                        v,
                                                    )
                                                }
                                            >
                                                <SelectTrigger className="h-11 rounded-xl border-border/80 bg-background">
                                                    <SelectValue placeholder="Selecione" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="carro">
                                                        Carro
                                                    </SelectItem>
                                                    <SelectItem value="moto">
                                                        Moto
                                                    </SelectItem>
                                                    <SelectItem value="caminhonete">
                                                        Caminhonete
                                                    </SelectItem>
                                                    <SelectItem value="caminhao">
                                                        Caminhão
                                                    </SelectItem>
                                                    <SelectItem value="outro">
                                                        Outro
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                            {err['veiculo.tipo_veiculo'] && (
                                                <span className="text-xs font-medium text-rose-500">
                                                    {
                                                        err[
                                                            'veiculo.tipo_veiculo'
                                                        ]
                                                    }
                                                </span>
                                            )}
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                                Placa*
                                            </label>
                                            <Input
                                                placeholder="ABC1D23"
                                                maxLength={8}
                                                value={data.veiculo.placa}
                                                onChange={(e) =>
                                                    atualizarVeiculo(
                                                        'placa',
                                                        e.target.value.toUpperCase(),
                                                    )
                                                }
                                                className="h-11 rounded-xl border-border/80 bg-background"
                                            />
                                            {err['veiculo.placa'] && (
                                                <span className="text-xs font-medium text-rose-500">
                                                    {err['veiculo.placa']}
                                                </span>
                                            )}
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                                Renavam*
                                            </label>
                                            <Input
                                                placeholder="00000000000"
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
                                                className="h-11 rounded-xl border-border/80 bg-background"
                                            />
                                            {err['veiculo.renavam'] && (
                                                <span className="text-xs font-medium text-rose-500">
                                                    {err['veiculo.renavam']}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                        <div className="space-y-2">
                                            <label className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                                Chassi*
                                            </label>
                                            <Input
                                                placeholder="17 caracteres"
                                                maxLength={17}
                                                value={data.veiculo.chassi}
                                                onChange={(e) =>
                                                    atualizarVeiculo(
                                                        'chassi',
                                                        e.target.value.toUpperCase(),
                                                    )
                                                }
                                                className="h-11 rounded-xl border-border/80 bg-background"
                                            />
                                            {err['veiculo.chassi'] && (
                                                <span className="text-xs font-medium text-rose-500">
                                                    {err['veiculo.chassi']}
                                                </span>
                                            )}
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                                Cor*
                                            </label>
                                            <Input
                                                placeholder="Ex: Prata"
                                                value={data.veiculo.cor}
                                                onChange={(e) =>
                                                    atualizarVeiculo(
                                                        'cor',
                                                        e.target.value,
                                                    )
                                                }
                                                className="h-11 rounded-xl border-border/80 bg-background"
                                            />
                                            {err['veiculo.cor'] && (
                                                <span className="text-xs font-medium text-rose-500">
                                                    {err['veiculo.cor']}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                        <div className="space-y-2">
                                            <label className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                                Marca*
                                            </label>
                                            <Input
                                                placeholder="Ex: Volkswagen"
                                                value={data.veiculo.marca}
                                                onChange={(e) =>
                                                    atualizarVeiculo(
                                                        'marca',
                                                        e.target.value,
                                                    )
                                                }
                                                className="h-11 rounded-xl border-border/80 bg-background"
                                            />
                                            {err['veiculo.marca'] && (
                                                <span className="text-xs font-medium text-rose-500">
                                                    {err['veiculo.marca']}
                                                </span>
                                            )}
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                                Modelo*
                                            </label>
                                            <Input
                                                placeholder="Ex: Gol 1.6"
                                                value={data.veiculo.modelo}
                                                onChange={(e) =>
                                                    atualizarVeiculo(
                                                        'modelo',
                                                        e.target.value,
                                                    )
                                                }
                                                className="h-11 rounded-xl border-border/80 bg-background"
                                            />
                                            {err['veiculo.modelo'] && (
                                                <span className="text-xs font-medium text-rose-500">
                                                    {err['veiculo.modelo']}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                                        <div className="space-y-2">
                                            <label className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                                Ano Fabricação*
                                            </label>
                                            <Input
                                                type="number"
                                                placeholder="2020"
                                                value={
                                                    data.veiculo.ano_fabricacao
                                                }
                                                onChange={(e) =>
                                                    atualizarVeiculo(
                                                        'ano_fabricacao',
                                                        e.target.value,
                                                    )
                                                }
                                                className="h-11 rounded-xl border-border/80 bg-background"
                                            />
                                            {err['veiculo.ano_fabricacao'] && (
                                                <span className="text-xs font-medium text-rose-500">
                                                    {
                                                        err[
                                                            'veiculo.ano_fabricacao'
                                                        ]
                                                    }
                                                </span>
                                            )}
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                                Ano Modelo*
                                            </label>
                                            <Input
                                                type="number"
                                                placeholder="2021"
                                                value={data.veiculo.ano_modelo}
                                                onChange={(e) =>
                                                    atualizarVeiculo(
                                                        'ano_modelo',
                                                        e.target.value,
                                                    )
                                                }
                                                className="h-11 rounded-xl border-border/80 bg-background"
                                            />
                                            {err['veiculo.ano_modelo'] && (
                                                <span className="text-xs font-medium text-rose-500">
                                                    {err['veiculo.ano_modelo']}
                                                </span>
                                            )}
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                                Combustível*
                                            </label>
                                            <Select
                                                value={data.veiculo.combustivel}
                                                onValueChange={(v) =>
                                                    atualizarVeiculo(
                                                        'combustivel',
                                                        v,
                                                    )
                                                }
                                            >
                                                <SelectTrigger className="h-11 rounded-xl border-border/80 bg-background">
                                                    <SelectValue placeholder="Selecione" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="gasolina">
                                                        Gasolina
                                                    </SelectItem>
                                                    <SelectItem value="etanol">
                                                        Etanol
                                                    </SelectItem>
                                                    <SelectItem value="flex">
                                                        Flex
                                                    </SelectItem>
                                                    <SelectItem value="diesel">
                                                        Diesel
                                                    </SelectItem>
                                                    <SelectItem value="eletrico">
                                                        Elétrico
                                                    </SelectItem>
                                                    <SelectItem value="hibrido">
                                                        Híbrido
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                            {err['veiculo.combustivel'] && (
                                                <span className="text-xs font-medium text-rose-500">
                                                    {err['veiculo.combustivel']}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                        <div className="space-y-2">
                                            <label className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                                Uso do Veículo*
                                            </label>
                                            <Select
                                                value={data.veiculo.uso}
                                                onValueChange={(v) =>
                                                    atualizarVeiculo('uso', v)
                                                }
                                            >
                                                <SelectTrigger className="h-11 rounded-xl border-border/80 bg-background">
                                                    <SelectValue placeholder="Selecione" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="particular">
                                                        Particular
                                                    </SelectItem>
                                                    <SelectItem value="comercial">
                                                        Comercial
                                                    </SelectItem>
                                                    <SelectItem value="aplicativo">
                                                        Motorista de aplicativo
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                            {err['veiculo.uso'] && (
                                                <span className="text-xs font-medium text-rose-500">
                                                    {err['veiculo.uso']}
                                                </span>
                                            )}
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                                CEP de Pernoite*
                                            </label>
                                            <Input
                                                placeholder="00000-000"
                                                value={
                                                    data.veiculo.cep_pernoite
                                                }
                                                onChange={(e) =>
                                                    atualizarVeiculo(
                                                        'cep_pernoite',
                                                        aplicarMascaraCEP(
                                                            e.target.value,
                                                        ),
                                                    )
                                                }
                                                className="h-11 rounded-xl border-border/80 bg-background"
                                            />
                                            {err['veiculo.cep_pernoite'] && (
                                                <span className="text-xs font-medium text-rose-500">
                                                    {
                                                        err[
                                                            'veiculo.cep_pernoite'
                                                        ]
                                                    }
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <label className="flex items-center gap-2 text-sm font-medium">
                                        <input
                                            type="checkbox"
                                            checked={
                                                data.veiculo.possui_rastreador
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

                                    <p className="text-xs text-muted-foreground">
                                        Preencha o condutor principal apenas se
                                        for diferente do próprio segurado.
                                    </p>
                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                        <div className="space-y-2">
                                            <label className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                                Condutor Principal
                                            </label>
                                            <Input
                                                placeholder="Nome do condutor"
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
                                                className="h-11 rounded-xl border-border/80 bg-background"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                                CPF do Condutor
                                            </label>
                                            <Input
                                                placeholder="000.000.000-00"
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
                                                className="h-11 rounded-xl border-border/80 bg-background"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </Section>
                        )}

                        {/* Seção condicional: Dados do Imóvel (só ramos residenciais) */}
                        {categoriaRamo === 'residencial' && (
                            <Section
                                icon={<Home className="h-4 w-4" />}
                                title="Dados do Imóvel"
                                description="Endereço e características do imóvel segurado — pode ser diferente do endereço do cliente"
                            >
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                        <div className="space-y-2">
                                            <label className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                                Tipo de Imóvel*
                                            </label>
                                            <Select
                                                value={
                                                    data.residencia.tipo_imovel
                                                }
                                                onValueChange={(v) =>
                                                    atualizarResidencia(
                                                        'tipo_imovel',
                                                        v,
                                                    )
                                                }
                                            >
                                                <SelectTrigger className="h-11 rounded-xl border-border/80 bg-background">
                                                    <SelectValue placeholder="Selecione" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="casa">
                                                        Casa
                                                    </SelectItem>
                                                    <SelectItem value="apartamento">
                                                        Apartamento
                                                    </SelectItem>
                                                    <SelectItem value="sobrado">
                                                        Sobrado
                                                    </SelectItem>
                                                    <SelectItem value="outro">
                                                        Outro
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                            {err['residencia.tipo_imovel'] && (
                                                <span className="text-xs font-medium text-rose-500">
                                                    {
                                                        err[
                                                            'residencia.tipo_imovel'
                                                        ]
                                                    }
                                                </span>
                                            )}
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                                Tipo de Construção*
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
                                                <SelectTrigger className="h-11 rounded-xl border-border/80 bg-background">
                                                    <SelectValue placeholder="Selecione" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="alvenaria">
                                                        Alvenaria
                                                    </SelectItem>
                                                    <SelectItem value="madeira">
                                                        Madeira
                                                    </SelectItem>
                                                    <SelectItem value="mista">
                                                        Mista
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                            {err[
                                                'residencia.tipo_construcao'
                                            ] && (
                                                <span className="text-xs font-medium text-rose-500">
                                                    {
                                                        err[
                                                            'residencia.tipo_construcao'
                                                        ]
                                                    }
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                            Endereço do Imóvel*
                                        </label>
                                        <Input
                                            placeholder="Rua, avenida..."
                                            value={
                                                data.residencia.endereco_imovel
                                            }
                                            onChange={(e) =>
                                                atualizarResidencia(
                                                    'endereco_imovel',
                                                    e.target.value,
                                                )
                                            }
                                            className="h-11 rounded-xl border-border/80 bg-background"
                                        />
                                        {err['residencia.endereco_imovel'] && (
                                            <span className="text-xs font-medium text-rose-500">
                                                {
                                                    err[
                                                        'residencia.endereco_imovel'
                                                    ]
                                                }
                                            </span>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                        <div className="space-y-2">
                                            <label className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                                Número*
                                            </label>
                                            <Input
                                                value={data.residencia.numero}
                                                onChange={(e) =>
                                                    atualizarResidencia(
                                                        'numero',
                                                        e.target.value,
                                                    )
                                                }
                                                className="h-11 rounded-xl border-border/80 bg-background"
                                            />
                                            {err['residencia.numero'] && (
                                                <span className="text-xs font-medium text-rose-500">
                                                    {err['residencia.numero']}
                                                </span>
                                            )}
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                                Complemento
                                            </label>
                                            <Input
                                                placeholder="Apto, bloco..."
                                                value={
                                                    data.residencia.complemento
                                                }
                                                onChange={(e) =>
                                                    atualizarResidencia(
                                                        'complemento',
                                                        e.target.value,
                                                    )
                                                }
                                                className="h-11 rounded-xl border-border/80 bg-background"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                                        <div className="space-y-2">
                                            <label className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                                Bairro*
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
                                                className="h-11 rounded-xl border-border/80 bg-background"
                                            />
                                            {err[
                                                'residencia.bairro_imovel'
                                            ] && (
                                                <span className="text-xs font-medium text-rose-500">
                                                    {
                                                        err[
                                                            'residencia.bairro_imovel'
                                                        ]
                                                    }
                                                </span>
                                            )}
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                                Cidade*
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
                                                className="h-11 rounded-xl border-border/80 bg-background"
                                            />
                                            {err[
                                                'residencia.cidade_imovel'
                                            ] && (
                                                <span className="text-xs font-medium text-rose-500">
                                                    {
                                                        err[
                                                            'residencia.cidade_imovel'
                                                        ]
                                                    }
                                                </span>
                                            )}
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                                UF*
                                            </label>
                                            <Input
                                                placeholder="SP"
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
                                                className="h-11 rounded-xl border-border/80 bg-background"
                                            />
                                            {err[
                                                'residencia.estado_imovel'
                                            ] && (
                                                <span className="text-xs font-medium text-rose-500">
                                                    {
                                                        err[
                                                            'residencia.estado_imovel'
                                                        ]
                                                    }
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                                        <div className="space-y-2">
                                            <label className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                                CEP*
                                            </label>
                                            <Input
                                                placeholder="00000-000"
                                                value={
                                                    data.residencia.cep_imovel
                                                }
                                                onChange={(e) =>
                                                    atualizarResidencia(
                                                        'cep_imovel',
                                                        aplicarMascaraCEP(
                                                            e.target.value,
                                                        ),
                                                    )
                                                }
                                                className="h-11 rounded-xl border-border/80 bg-background"
                                            />
                                            {err['residencia.cep_imovel'] && (
                                                <span className="text-xs font-medium text-rose-500">
                                                    {
                                                        err[
                                                            'residencia.cep_imovel'
                                                        ]
                                                    }
                                                </span>
                                            )}
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                                Área Construída (m²)*
                                            </label>
                                            <Input
                                                type="number"
                                                placeholder="120"
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
                                                className="h-11 rounded-xl border-border/80 bg-background"
                                            />
                                            {err[
                                                'residencia.area_construida_m2'
                                            ] && (
                                                <span className="text-xs font-medium text-rose-500">
                                                    {
                                                        err[
                                                            'residencia.area_construida_m2'
                                                        ]
                                                    }
                                                </span>
                                            )}
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                                Ano de Construção
                                            </label>
                                            <Input
                                                type="number"
                                                placeholder="2010"
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
                                                className="h-11 rounded-xl border-border/80 bg-background"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                            Ocupação do Imóvel*
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
                                            <SelectTrigger className="h-11 rounded-xl border-border/80 bg-background">
                                                <SelectValue placeholder="Selecione" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="residencia_habitual">
                                                    Residência habitual
                                                </SelectItem>
                                                <SelectItem value="veraneio">
                                                    Casa de veraneio
                                                </SelectItem>
                                                <SelectItem value="alugado">
                                                    Alugado a terceiros
                                                </SelectItem>
                                                <SelectItem value="desocupado">
                                                    Desocupado
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                        {err['residencia.ocupacao'] && (
                                            <span className="text-xs font-medium text-rose-500">
                                                {err['residencia.ocupacao']}
                                            </span>
                                        )}
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
                                        (alarme, cerca elétrica, etc.)
                                    </label>
                                </div>
                            </Section>
                        )}

                        {/* Seção condicional: Dados do Segurado (só ramos de vida) */}
                        {categoriaRamo === 'vida' && (
                            <Section
                                icon={<HeartPulse className="h-4 w-4" />}
                                title="Dados do Segurado (Vida)"
                                description="Perfil de risco exigido pela seguradora"
                            >
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                        <div className="space-y-2">
                                            <label className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                                Profissão*
                                            </label>
                                            <Input
                                                value={data.vida.profissao}
                                                onChange={(e) =>
                                                    atualizarVida(
                                                        'profissao',
                                                        e.target.value,
                                                    )
                                                }
                                                className="h-11 rounded-xl border-border/80 bg-background"
                                            />
                                            {err['vida.profissao'] && (
                                                <span className="text-xs font-medium text-rose-500">
                                                    {err['vida.profissao']}
                                                </span>
                                            )}
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                                Capital Segurado*
                                            </label>
                                            <Input
                                                type="number"
                                                placeholder="R$ 0,00"
                                                value={
                                                    data.vida.capital_segurado
                                                }
                                                onChange={(e) =>
                                                    atualizarVida(
                                                        'capital_segurado',
                                                        e.target.value,
                                                    )
                                                }
                                                className="h-11 rounded-xl border-border/80 bg-background"
                                            />
                                            {err['vida.capital_segurado'] && (
                                                <span className="text-xs font-medium text-rose-500">
                                                    {
                                                        err[
                                                            'vida.capital_segurado'
                                                        ]
                                                    }
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                                        <label className="flex items-center gap-2 text-sm font-medium">
                                            <input
                                                type="checkbox"
                                                checked={
                                                    data.vida
                                                        .possui_atividade_profissional_risco
                                                }
                                                onChange={(e) =>
                                                    atualizarVida(
                                                        'possui_atividade_profissional_risco',
                                                        e.target.checked,
                                                    )
                                                }
                                                className="h-4 w-4 rounded border-border/80"
                                            />
                                            Profissão de risco
                                        </label>
                                        <label className="flex items-center gap-2 text-sm font-medium">
                                            <input
                                                type="checkbox"
                                                checked={data.vida.fumante}
                                                onChange={(e) =>
                                                    atualizarVida(
                                                        'fumante',
                                                        e.target.checked,
                                                    )
                                                }
                                                className="h-4 w-4 rounded border-border/80"
                                            />
                                            Fumante
                                        </label>
                                        <label className="flex items-center gap-2 text-sm font-medium">
                                            <input
                                                type="checkbox"
                                                checked={
                                                    data.vida
                                                        .possui_doenca_preexistente
                                                }
                                                onChange={(e) =>
                                                    atualizarVida(
                                                        'possui_doenca_preexistente',
                                                        e.target.checked,
                                                    )
                                                }
                                                className="h-4 w-4 rounded border-border/80"
                                            />
                                            Doença preexistente
                                        </label>
                                        <label className="flex items-center gap-2 text-sm font-medium">
                                            <input
                                                type="checkbox"
                                                checked={
                                                    data.vida
                                                        .pratica_esporte_risco
                                                }
                                                onChange={(e) =>
                                                    atualizarVida(
                                                        'pratica_esporte_risco',
                                                        e.target.checked,
                                                    )
                                                }
                                                className="h-4 w-4 rounded border-border/80"
                                            />
                                            Esporte de risco
                                        </label>
                                    </div>

                                    {data.vida.possui_doenca_preexistente && (
                                        <div className="space-y-2">
                                            <label className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                                Descreva a(s) doença(s)*
                                            </label>
                                            <textarea
                                                value={
                                                    data.vida.descricao_doencas
                                                }
                                                onChange={(e) =>
                                                    atualizarVida(
                                                        'descricao_doencas',
                                                        e.target.value,
                                                    )
                                                }
                                                className="min-h-20 w-full resize-none rounded-xl border border-border/80 bg-background px-3 py-2 text-sm focus-visible:ring-1 focus-visible:ring-emerald-500 focus-visible:outline-none"
                                            />
                                            {err['vida.descricao_doencas'] && (
                                                <span className="text-xs font-medium text-rose-500">
                                                    {
                                                        err[
                                                            'vida.descricao_doencas'
                                                        ]
                                                    }
                                                </span>
                                            )}
                                        </div>
                                    )}

                                    {data.vida.pratica_esporte_risco && (
                                        <div className="space-y-2">
                                            <label className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                                Qual esporte?*
                                            </label>
                                            <Input
                                                placeholder="Ex: Mergulho, paraquedismo, motociclismo..."
                                                value={data.vida.qual_esporte}
                                                onChange={(e) =>
                                                    atualizarVida(
                                                        'qual_esporte',
                                                        e.target.value,
                                                    )
                                                }
                                                className="h-11 rounded-xl border-border/80 bg-background"
                                            />
                                            {err['vida.qual_esporte'] && (
                                                <span className="text-xs font-medium text-rose-500">
                                                    {err['vida.qual_esporte']}
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </Section>
                        )}

                        {/* Seção condicional: Beneficiários (só ramos de vida) — lista dinâmica */}
                        {categoriaRamo === 'vida' && (
                            <Section
                                icon={<HeartPulse className="h-4 w-4" />}
                                title="Beneficiários"
                                description="Quem recebe a indenização — a soma dos percentuais precisa fechar em 100%"
                            >
                                <div className="space-y-4">
                                    {data.beneficiarios.map(
                                        (beneficiario: any, index: number) => (
                                            <div
                                                key={index}
                                                className="space-y-3 rounded-xl border border-border/70 bg-background p-3"
                                            >
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
                                                        Beneficiário {index + 1}
                                                    </span>
                                                    {data.beneficiarios.length >
                                                        1 && (
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                removerBeneficiario(
                                                                    index,
                                                                )
                                                            }
                                                            className="text-muted-foreground transition-colors hover:text-rose-500"
                                                        >
                                                            <X className="h-4 w-4" />
                                                        </button>
                                                    )}
                                                </div>
                                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                                    <Input
                                                        placeholder="Nome completo*"
                                                        value={
                                                            beneficiario.nome_completo
                                                        }
                                                        onChange={(e) =>
                                                            atualizarBeneficiario(
                                                                index,
                                                                'nome_completo',
                                                                e.target.value,
                                                            )
                                                        }
                                                        className="h-10 rounded-xl border-border/80 bg-background"
                                                    />
                                                    <Input
                                                        placeholder="CPF*"
                                                        value={beneficiario.cpf}
                                                        onChange={(e) =>
                                                            atualizarBeneficiario(
                                                                index,
                                                                'cpf',
                                                                formataCpfCnpj(
                                                                    e.target
                                                                        .value,
                                                                ),
                                                            )
                                                        }
                                                        className="h-10 rounded-xl border-border/80 bg-background"
                                                    />
                                                </div>
                                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                                                    <Input
                                                        type="date"
                                                        value={
                                                            beneficiario.data_nascimento
                                                        }
                                                        onChange={(e) =>
                                                            atualizarBeneficiario(
                                                                index,
                                                                'data_nascimento',
                                                                e.target.value,
                                                            )
                                                        }
                                                        className="h-10 rounded-xl border-border/80 bg-background"
                                                    />
                                                    <Select
                                                        value={
                                                            beneficiario.parentesco
                                                        }
                                                        onValueChange={(v) =>
                                                            atualizarBeneficiario(
                                                                index,
                                                                'parentesco',
                                                                v,
                                                            )
                                                        }
                                                    >
                                                        <SelectTrigger className="h-10 w-full rounded-xl border-border/80 bg-background">
                                                            <SelectValue placeholder="Parentesco*" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {PARENTESCOS.map(
                                                                (p) => (
                                                                    <SelectItem
                                                                        key={
                                                                            p.value
                                                                        }
                                                                        value={
                                                                            p.value
                                                                        }
                                                                    >
                                                                        {
                                                                            p.label
                                                                        }
                                                                    </SelectItem>
                                                                ),
                                                            )}
                                                        </SelectContent>
                                                    </Select>
                                                    <Input
                                                        type="number"
                                                        placeholder="% Indenização*"
                                                        value={
                                                            beneficiario.percentual_indenizacao
                                                        }
                                                        onChange={(e) =>
                                                            atualizarBeneficiario(
                                                                index,
                                                                'percentual_indenizacao',
                                                                e.target.value,
                                                            )
                                                        }
                                                        className="h-10 rounded-xl border-border/80 bg-background"
                                                    />
                                                </div>
                                            </div>
                                        ),
                                    )}

                                    <div className="flex items-center justify-between">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={adicionarBeneficiario}
                                            className="h-9 rounded-xl border-border/70 px-3 text-sm hover:border-emerald-500/40 hover:bg-emerald-500/10 hover:text-emerald-600"
                                        >
                                            <Plus className="mr-1 h-4 w-4" />
                                            Adicionar beneficiário
                                        </Button>
                                        <span
                                            className={`text-xs font-semibold ${
                                                Math.abs(
                                                    somaPercentuaisBeneficiarios -
                                                        100,
                                                ) > 0.01
                                                    ? 'text-rose-500'
                                                    : 'text-emerald-600'
                                            }`}
                                        >
                                            Soma: {somaPercentuaisBeneficiarios}
                                            %
                                        </span>
                                    </div>
                                    {err['beneficiarios'] && (
                                        <span className="block text-xs font-medium text-rose-500">
                                            {err['beneficiarios']}
                                        </span>
                                    )}
                                </div>
                            </Section>
                        )}

                        {/* Seção condicional: Dados da Empresa (só ramos empresariais) */}
                        {categoriaRamo === 'empresarial' && (
                            <Section
                                icon={<Building2 className="h-4 w-4" />}
                                title="Dados da Empresa"
                                description="Perfil de risco e endereço do estabelecimento segurado"
                            >
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                                        <div className="space-y-2 sm:col-span-2">
                                            <label className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                                CNAE / Atividade*
                                            </label>
                                            <Input
                                                placeholder="Ex: 6201-5/01 Desenvolvimento de software"
                                                value={
                                                    data.empresarial
                                                        .cnae_ou_atividade
                                                }
                                                onChange={(e) =>
                                                    atualizarEmpresarial(
                                                        'cnae_ou_atividade',
                                                        e.target.value,
                                                    )
                                                }
                                                className="h-11 rounded-xl border-border/80 bg-background"
                                            />
                                            {err[
                                                'empresarial.cnae_ou_atividade'
                                            ] && (
                                                <span className="text-xs font-medium text-rose-500">
                                                    {
                                                        err[
                                                            'empresarial.cnae_ou_atividade'
                                                        ]
                                                    }
                                                </span>
                                            )}
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                                Nº Funcionários*
                                            </label>
                                            <Input
                                                type="number"
                                                value={
                                                    data.empresarial
                                                        .numero_funcionarios
                                                }
                                                onChange={(e) =>
                                                    atualizarEmpresarial(
                                                        'numero_funcionarios',
                                                        e.target.value,
                                                    )
                                                }
                                                className="h-11 rounded-xl border-border/80 bg-background"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                        <div className="space-y-2">
                                            <label className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                                Valor do Patrimônio Segurado*
                                            </label>
                                            <Input
                                                type="number"
                                                placeholder="R$ 0,00"
                                                value={
                                                    data.empresarial
                                                        .valor_patrimonio_segurado
                                                }
                                                onChange={(e) =>
                                                    atualizarEmpresarial(
                                                        'valor_patrimonio_segurado',
                                                        e.target.value,
                                                    )
                                                }
                                                className="h-11 rounded-xl border-border/80 bg-background"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                                Faturamento Anual*
                                            </label>
                                            <Input
                                                type="number"
                                                placeholder="R$ 0,00"
                                                value={
                                                    data.empresarial
                                                        .faturamento_anual
                                                }
                                                onChange={(e) =>
                                                    atualizarEmpresarial(
                                                        'faturamento_anual',
                                                        e.target.value,
                                                    )
                                                }
                                                className="h-11 rounded-xl border-border/80 bg-background"
                                            />
                                        </div>
                                    </div>

                                    <label className="flex items-center gap-2 text-sm font-medium">
                                        <input
                                            type="checkbox"
                                            checked={
                                                data.empresarial
                                                    .possui_cobertura_incendio_basica
                                            }
                                            onChange={(e) =>
                                                atualizarEmpresarial(
                                                    'possui_cobertura_incendio_basica',
                                                    e.target.checked,
                                                )
                                            }
                                            className="h-4 w-4 rounded border-border/80"
                                        />
                                        Possui cobertura de incêndio básica
                                        (obrigatória por lei)
                                    </label>

                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                            Coberturas Adicionais
                                        </label>
                                        <textarea
                                            placeholder="Ex: Lucros cessantes, Responsabilidade civil..."
                                            value={
                                                data.empresarial
                                                    .coberturas_adicionais
                                            }
                                            onChange={(e) =>
                                                atualizarEmpresarial(
                                                    'coberturas_adicionais',
                                                    e.target.value,
                                                )
                                            }
                                            className="min-h-16 w-full resize-none rounded-xl border border-border/80 bg-background px-3 py-2 text-sm focus-visible:ring-1 focus-visible:ring-emerald-500 focus-visible:outline-none"
                                        />
                                    </div>

                                    <p className="text-xs text-muted-foreground">
                                        Endereço do estabelecimento segurado
                                        (pode ser diferente do endereço
                                        cadastral da empresa).
                                    </p>
                                    <div className="space-y-2">
                                        <Input
                                            placeholder="Endereço do estabelecimento*"
                                            value={
                                                data.empresarial
                                                    .endereco_estabelecimento
                                            }
                                            onChange={(e) =>
                                                atualizarEmpresarial(
                                                    'endereco_estabelecimento',
                                                    e.target.value,
                                                )
                                            }
                                            className="h-11 rounded-xl border-border/80 bg-background"
                                        />
                                    </div>
                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
                                        <Input
                                            placeholder="Número*"
                                            value={
                                                data.empresarial
                                                    .numero_estabelecimento
                                            }
                                            onChange={(e) =>
                                                atualizarEmpresarial(
                                                    'numero_estabelecimento',
                                                    e.target.value,
                                                )
                                            }
                                            className="h-11 rounded-xl border-border/80 bg-background"
                                        />
                                        <Input
                                            placeholder="Bairro*"
                                            value={
                                                data.empresarial
                                                    .bairro_estabelecimento
                                            }
                                            onChange={(e) =>
                                                atualizarEmpresarial(
                                                    'bairro_estabelecimento',
                                                    e.target.value,
                                                )
                                            }
                                            className="h-11 rounded-xl border-border/80 bg-background"
                                        />
                                        <Input
                                            placeholder="Cidade*"
                                            value={
                                                data.empresarial
                                                    .cidade_estabelecimento
                                            }
                                            onChange={(e) =>
                                                atualizarEmpresarial(
                                                    'cidade_estabelecimento',
                                                    e.target.value,
                                                )
                                            }
                                            className="h-11 rounded-xl border-border/80 bg-background"
                                        />
                                        <Input
                                            placeholder="UF*"
                                            maxLength={2}
                                            value={
                                                data.empresarial
                                                    .estado_estabelecimento
                                            }
                                            onChange={(e) =>
                                                atualizarEmpresarial(
                                                    'estado_estabelecimento',
                                                    e.target.value.toUpperCase(),
                                                )
                                            }
                                            className="h-11 rounded-xl border-border/80 bg-background"
                                        />
                                    </div>
                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                                        <Input
                                            placeholder="CEP*"
                                            value={
                                                data.empresarial
                                                    .cep_estabelecimento
                                            }
                                            onChange={(e) =>
                                                atualizarEmpresarial(
                                                    'cep_estabelecimento',
                                                    aplicarMascaraCEP(
                                                        e.target.value,
                                                    ),
                                                )
                                            }
                                            className="h-11 rounded-xl border-border/80 bg-background"
                                        />
                                    </div>
                                </div>
                            </Section>
                        )}

                        {/* Seção 2 e 3 lado a lado — mesmo padrão de duas colunas do modal de segurado */}
                        <div className="grid gap-4 md:grid-cols-2">
                            <Section
                                icon={<Calendar className="h-4 w-4" />}
                                title="Vigência"
                                description="Período de validade da apólice"
                            >
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                            Início da Vigência*
                                        </label>
                                        <Input
                                            type="date"
                                            value={data.inicio_vigencia}
                                            onChange={(e) =>
                                                setData(
                                                    'inicio_vigencia',
                                                    e.target.value,
                                                )
                                            }
                                            className="h-11 rounded-xl border-border/80 bg-background"
                                        />
                                        {errors.inicio_vigencia && (
                                            <span className="text-xs font-medium text-rose-500">
                                                {errors.inicio_vigencia}
                                            </span>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                            Fim da Vigência*
                                        </label>
                                        <Input
                                            type="date"
                                            value={data.fim_vigencia}
                                            onChange={(e) =>
                                                setData(
                                                    'fim_vigencia',
                                                    e.target.value,
                                                )
                                            }
                                            className="h-11 rounded-xl border-border/80 bg-background"
                                        />
                                        {errors.fim_vigencia && (
                                            <span className="text-xs font-medium text-rose-500">
                                                {errors.fim_vigencia}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </Section>

                            {/* Seção 3: Valores e Pagamento */}
                            <Section
                                icon={<DollarSign className="h-4 w-4" />}
                                title="Valores e Pagamento"
                                description="Premiação, cobertura e condições de pagamento"
                            >
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                        <div className="space-y-2">
                                            <label className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                                Valor do Prêmio*
                                            </label>
                                            <Input
                                                type="number"
                                                placeholder="R$ 0,00"
                                                value={data.valor_premio_total}
                                                onChange={(e) =>
                                                    setData(
                                                        'valor_premio_total',
                                                        e.target.value,
                                                    )
                                                }
                                                className="h-11 rounded-xl border-border/80 bg-background"
                                            />
                                            {errors.valor_premio_total && (
                                                <span className="text-xs font-medium text-rose-500">
                                                    {errors.valor_premio_total}
                                                </span>
                                            )}
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                                Valor de Cobertura*
                                            </label>
                                            <Input
                                                type="number"
                                                placeholder="R$ 0,00"
                                                value={data.valor_cobertura}
                                                onChange={(e) =>
                                                    setData(
                                                        'valor_cobertura',
                                                        e.target.value,
                                                    )
                                                }
                                                className="h-11 rounded-xl border-border/80 bg-background"
                                            />
                                            {errors.valor_cobertura && (
                                                <span className="text-xs font-medium text-rose-500">
                                                    {errors.valor_cobertura}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                        <div className="space-y-2">
                                            <label className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                                Quantidade de Parcelas*
                                            </label>
                                            <Input
                                                type="number"
                                                placeholder="12"
                                                max="12"
                                                min="1"
                                                value={data.quantidade_parcelas}
                                                onChange={(e) =>
                                                    setData(
                                                        'quantidade_parcelas',
                                                        e.target.value,
                                                    )
                                                }
                                                className="h-11 rounded-xl border-border/80 bg-background"
                                            />
                                            {errors.quantidade_parcelas && (
                                                <span className="text-xs font-medium text-rose-500">
                                                    {errors.quantidade_parcelas}
                                                </span>
                                            )}
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                                Forma de Pagamento*
                                            </label>
                                            <Select
                                                value={data.forma_pagamento}
                                                onValueChange={(v) =>
                                                    setData(
                                                        'forma_pagamento',
                                                        v,
                                                    )
                                                }
                                            >
                                                <SelectTrigger className="h-11 rounded-xl border-border/80 bg-background">
                                                    <SelectValue placeholder="Selecione" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="boleto">
                                                        Boleto
                                                    </SelectItem>
                                                    <SelectItem value="cartao">
                                                        Cartão
                                                    </SelectItem>
                                                    <SelectItem value="pix">
                                                        Pix
                                                    </SelectItem>
                                                    <SelectItem value="debito">
                                                        Débito Automático
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                            {errors.forma_pagamento && (
                                                <span className="text-xs font-medium text-rose-500">
                                                    {errors.forma_pagamento}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </Section>
                        </div>

                        {/* Seção 4: Observações */}
                        <Section
                            icon={<Shield className="h-4 w-4" />}
                            title="Informações Adicionais"
                            description="Notas ou observações gerais sobre a apólice"
                        >
                            <div className="space-y-2">
                                <label className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                    Observação
                                </label>
                                <textarea
                                    value={data.observacoes}
                                    onChange={(e) =>
                                        setData('observacoes', e.target.value)
                                    }
                                    className="min-h-[90px] w-full resize-none rounded-xl border border-border/80 bg-background px-3 py-2 text-sm focus-visible:ring-1 focus-visible:ring-emerald-500 focus-visible:outline-none"
                                    placeholder="Observações adicionais..."
                                />
                            </div>
                        </Section>
                    </div>
                </div>

                {/* Footer com Botões */}
                <div className="flex shrink-0 flex-col-reverse gap-3 border-t border-border/70 bg-background px-6 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-8">
                    <p className="text-xs text-muted-foreground">
                        Campos com{' '}
                        <span className="font-bold text-emerald-600">*</span>{' '}
                        são obrigatórios.
                    </p>
                    <div className="flex gap-3">
                        <Button
                            variant="outline"
                            onClick={() => setOpen(false)}
                            className="h-11 rounded-xl px-5"
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={salvarApolice}
                            disabled={
                                processing ||
                                (categoriaRamo === 'vida' &&
                                    Math.abs(
                                        somaPercentuaisBeneficiarios - 100,
                                    ) > 0.01)
                            }
                            className="h-11 rounded-xl bg-emerald-500 px-5 font-bold text-white shadow-lg shadow-emerald-500/20 transition-all hover:bg-emerald-600 active:scale-[0.98]"
                        >
                            {processing ? (
                                'Salvando...'
                            ) : (
                                <>
                                    <Check className="mr-2 h-4 w-4" />
                                    Salvar Apolice
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
