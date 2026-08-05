import { useForm } from '@inertiajs/react';
import {
    Check,
    ChevronRight,
    FileText,
    MapPin,
    Phone,
    UserRound,
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
import 'react-toastify/dist/ReactToastify.css';
import { formataCpfCnpj } from '@/utils/cpfMask';

const aplicarMascaraCelular = (valor: string) => {
    const num = valor.replace(/\D/g, '').substring(0, 11);

    if (num.length <= 2) {
        return `(${num}`;
    }

    if (num.length <= 6) {
        return `(${num.substring(0, 2)}) ${num.substring(2)}`;
    }

    return `(${num.substring(0, 2)}) ${num.substring(2, 7)}-${num.substring(7)}`;
};

const aplicarMascaraFixo = (valor: string) => {
    const num = valor.replace(/\D/g, '').substring(0, 10);

    if (num.length <= 2) {
        return `(${num}`;
    }

    if (num.length <= 6) {
        return `(${num.substring(0, 2)}) ${num.substring(2)}`;
    }

    return `(${num.substring(0, 2)}) ${num.substring(2, 6)}-${num.substring(6)}`;
};

const aplicarMascaraCEP = (valor: string) =>
    valor
        .replace(/\D/g, '')
        .substring(0, 8)
        .replace(/(\d{5})(\d)/, '$1-$2');

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

export default function CreateSeguradoModal({ open, setOpen }: any) {
    const [tipoPessoa, setTipoPessoa] = useState('pf');
    const [estados, setEstados] = useState<any[]>([]);
    const isPF = tipoPessoa === 'pf';
    const labelNome = isPF ? 'Nome completo' : 'Nome fantasia';
    const labelDocumento = isPF ? 'CPF' : 'CNPJ';
    const labelData = isPF ? 'Data de nascimento' : 'Data de fundação';

    const { data, setData, post, processing, errors, reset, clearErrors } =
        useForm({
            tipo_pessoa: 'pf',
            nome_completo: '',
            cpf_cnpj: '',
            data_nascimento_fundacao: '',
            email: '',
            celular_whatsapp: '',
            telefone_fixo: '',
            endereco: '',
            bairro: '', // Adicionado para corresponder ao ViaCEP
            cidade: '',
            estado: '',
            cep: '',
            observacoes: '',
        });

    useEffect(() => {
        if (!open) {
            reset();
            clearErrors();
            setTipoPessoa('pf');
        }
    }, [open]);

    const handleClose = (isOpen: boolean) => {
        if (!isOpen) {
            reset();
            clearErrors();
            setTipoPessoa('pf');
        }
        setOpen(isOpen);
    };

    useEffect(() => {
        fetch(
            'https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome',
        )
            .then((resposta) => resposta.json())
            .then(setEstados)
            .catch(() => setEstados([]));
    }, []);

    const buscarCep = async (cep: string) => {
        const cepLimpo = cep.replace(/\D/g, '');

        if (cepLimpo.length === 8) {
            try {
                const response = await fetch(
                    `https://viacep.com.br/ws/${cepLimpo}/json/`,
                );
                const resultado = await response.json();

                if (!resultado.erro) {
                    setData((prev) => ({
                        ...prev,
                        cep: cepLimpo,
                        endereco: resultado.logradouro,
                        bairro: resultado.bairro,
                        cidade: resultado.localidade,
                        estado: resultado.uf,
                    }));
                } else {
                    console.log('CEP não encontrado.');
                }
            } catch (error) {
                console.error('Erro ao buscar o CEP:', error);
            }
        }
    };

    const salvarClientes = () =>
        post('/clientes', {
            onSuccess: () => {
                toast.success('Segurado salvo com sucesso!', {
                    position: 'top-right',
                    style: {
                        color: '#e0ebe4',
                    },
                });
                setOpen(false);
            },
            onError: () =>
                toast.error('Falha ao salvar. Verifique os campos.', {
                    position: 'top-right',
                    style: {
                        color: '#b61212',
                    },
                }),
        });

    return (
        <Dialog
            open={open}
            onOpenChange={(isOpen) => {
                // Se o modal está fechando (isOpen vira false)
                if (!isOpen) {
                    reset(); // Reseta os campos do formulário do Inertia
                    clearErrors(); // Limpa os erros de validação
                    setTipoPessoa('pf'); // Reseta estados locais extras (se houver)
                }
                setOpen(isOpen); // Atualiza o estado no componente pai
            }}
        >
            <DialogContent className="!flex max-h-[92vh] max-w-3xl flex-col gap-0 overflow-hidden rounded-2xl border-border/70 p-0 shadow-2xl">
                <DialogHeader className="relative shrink-0 overflow-hidden border-b border-border/70 bg-gradient-to-br from-emerald-500/[0.12] via-background to-background px-6 py-6 pr-12 sm:px-8">
                    <div className="absolute -top-12 -right-10 h-36 w-36 rounded-full bg-emerald-500/10 blur-2xl" />
                    <div className="relative flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-lg shadow-emerald-500/25">
                            <UserRound className="h-5 w-5" />
                        </div>
                        <div>
                            <div className="mb-1 flex items-center gap-1.5 text-[10px] font-bold tracking-[0.16em] text-emerald-600 uppercase">
                                <span>Segurados</span>
                                <ChevronRight className="h-3 w-3" />
                                <span>Novo cadastro</span>
                            </div>
                            <DialogTitle className="text-xl font-bold tracking-tight sm:text-2xl">
                                Cadastrar segurado
                            </DialogTitle>
                        </div>
                    </div>
                    <p className="relative mt-3 max-w-lg text-sm leading-relaxed text-muted-foreground">
                        Informe os dados abaixo para cadastrar um novo segurado.
                        Campos obrigatórios estão marcados com{' '}
                        <span className="font-bold text-emerald-600">*</span>.
                    </p>
                </DialogHeader>

                <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-6 py-6 sm:px-8">
                    <Section
                        icon={<UserRound className="h-4 w-4" />}
                        title="Dados principais"
                        description="Identificação do segurado"
                    >
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm leading-none font-medium">
                                    Tipo de pessoa *
                                </label>
                                <Select
                                    value={tipoPessoa}
                                    onValueChange={(valor) => {
                                        setTipoPessoa(valor);
                                        setData((prev) => ({
                                            ...prev,
                                            tipo_pessoa: valor,
                                            cpf_cnpj: '',
                                        }));
                                    }}
                                >
                                    <SelectTrigger className="h-10 w-full rounded-xl border border-border/70 bg-background px-3 py-2 text-sm shadow-sm transition-all hover:border-emerald-500/40 focus:ring-4 focus:ring-emerald-500/10 focus:outline-none">
                                        <SelectValue placeholder="Selecione PF ou PJ" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl border border-border/70 bg-popover text-popover-foreground shadow-md">
                                        <SelectItem
                                            value="pf"
                                            className="cursor-pointer rounded-lg"
                                        >
                                            Pessoa física
                                        </SelectItem>
                                        <SelectItem
                                            value="pj"
                                            className="cursor-pointer rounded-lg"
                                        >
                                            Pessoa jurídica
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <label className="text-sm leading-none font-medium">
                                        {labelNome} *
                                    </label>
                                    <Input
                                        className="h-10 rounded-xl border border-border/70 bg-background px-3 py-2 text-sm shadow-sm transition-all placeholder:text-muted-foreground/55 hover:border-emerald-500/40 focus-visible:ring-4 focus-visible:ring-emerald-500/10 focus-visible:outline-none"
                                        placeholder={
                                            isPF
                                                ? 'Nome do segurado'
                                                : 'Nome da empresa'
                                        }
                                        value={data.nome_completo}
                                        onChange={(e) =>
                                            setData(
                                                'nome_completo',
                                                e.target.value,
                                            )
                                        }
                                    />
                                    {errors.nome_completo && (
                                        <span className="text-xs font-medium text-rose-500">
                                            {errors.nome_completo}
                                        </span>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm leading-none font-medium">
                                        {labelDocumento} *
                                    </label>
                                    <Input
                                        className="h-10 rounded-xl border border-border/70 bg-background px-3 py-2 text-sm shadow-sm transition-all placeholder:text-muted-foreground/55 hover:border-emerald-500/40 focus-visible:ring-4 focus-visible:ring-emerald-500/10 focus-visible:outline-none"
                                        type="text"
                                        value={data.cpf_cnpj}
                                        onChange={(e) =>
                                            setData(
                                                'cpf_cnpj',
                                                formataCpfCnpj(e.target.value),
                                            )
                                        }
                                        placeholder={
                                            isPF
                                                ? '000.000.000-00'
                                                : '00.000.000/0000-00'
                                        }
                                        maxLength={isPF ? 14 : 18}
                                    />
                                    {errors.cpf_cnpj && (
                                        <span className="text-xs font-medium text-rose-500">
                                            {errors.cpf_cnpj}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm leading-none font-medium">
                                    {labelData} *
                                </label>
                                <Input
                                    className="h-10 rounded-xl border border-border/70 bg-background px-3 py-2 text-sm shadow-sm transition-all placeholder:text-muted-foreground/55 hover:border-emerald-500/40 focus-visible:ring-4 focus-visible:ring-emerald-500/10 focus-visible:outline-none"
                                    type="date"
                                    value={data.data_nascimento_fundacao}
                                    onChange={(e) =>
                                        setData(
                                            'data_nascimento_fundacao',
                                            e.target.value,
                                        )
                                    }
                                />
                                {errors.data_nascimento_fundacao && (
                                    <span className="text-xs font-medium text-rose-500">
                                        {errors.data_nascimento_fundacao}
                                    </span>
                                )}
                            </div>
                        </div>
                    </Section>

                    <Section
                        icon={<Phone className="h-4 w-4" />}
                        title="Contato"
                        description="Canais para comunicação"
                    >
                        <div className="space-y-4">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <label className="text-sm leading-none font-medium">
                                        E-mail *
                                    </label>
                                    <Input
                                        className="h-10 rounded-xl border border-border/70 bg-background px-3 py-2 text-sm shadow-sm transition-all placeholder:text-muted-foreground/55 hover:border-emerald-500/40 focus-visible:ring-4 focus-visible:ring-emerald-500/10 focus-visible:outline-none"
                                        type="email"
                                        placeholder="exemplo@payflow.com"
                                        value={data.email}
                                        onChange={(e) =>
                                            setData('email', e.target.value)
                                        }
                                    />
                                    {errors.email && (
                                        <span className="text-xs font-medium text-rose-500">
                                            {errors.email}
                                        </span>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm leading-none font-medium">
                                        Celular / WhatsApp *
                                    </label>
                                    <Input
                                        className="h-10 rounded-xl border border-border/70 bg-background px-3 py-2 text-sm shadow-sm transition-all placeholder:text-muted-foreground/55 hover:border-emerald-500/40 focus-visible:ring-4 focus-visible:ring-emerald-500/10 focus-visible:outline-none"
                                        type="tel"
                                        placeholder="(11) 99999-9999"
                                        value={data.celular_whatsapp}
                                        onChange={(e) =>
                                            setData(
                                                'celular_whatsapp',
                                                aplicarMascaraCelular(
                                                    e.target.value,
                                                ),
                                            )
                                        }
                                    />
                                    {errors.celular_whatsapp && (
                                        <span className="text-xs font-medium text-rose-500">
                                            {errors.celular_whatsapp}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm leading-none font-medium">
                                    Telefone fixo
                                </label>
                                <Input
                                    className="h-10 rounded-xl border border-border/70 bg-background px-3 py-2 text-sm shadow-sm transition-all placeholder:text-muted-foreground/55 hover:border-emerald-500/40 focus-visible:ring-4 focus-visible:ring-emerald-500/10 focus-visible:outline-none"
                                    type="tel"
                                    placeholder="(11) 3333-3333"
                                    value={data.telefone_fixo}
                                    onChange={(e) =>
                                        setData(
                                            'telefone_fixo',
                                            aplicarMascaraFixo(e.target.value),
                                        )
                                    }
                                />
                                {errors.telefone_fixo && (
                                    <span className="text-xs font-medium text-rose-500">
                                        {errors.telefone_fixo}
                                    </span>
                                )}
                            </div>
                        </div>
                    </Section>

                    <Section
                        icon={<MapPin className="h-4 w-4" />}
                        title="Localização"
                        description="Endereço principal"
                    >
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm leading-none font-medium">
                                    Estado *
                                </label>
                                <Select
                                    value={data.estado}
                                    onValueChange={(valor) =>
                                        setData('estado', valor)
                                    }
                                >
                                    <SelectTrigger className="h-10 w-full rounded-xl border border-border/70 bg-background px-3 py-2 text-sm shadow-sm transition-all hover:border-emerald-500/40 focus:ring-4 focus:ring-emerald-500/10 focus:outline-none">
                                        <SelectValue placeholder="Selecione o estado" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl border border-border/70 bg-popover text-popover-foreground shadow-md">
                                        {estados.map((estado) => (
                                            <SelectItem
                                                key={estado.id}
                                                value={estado.sigla}
                                                className="cursor-pointer rounded-lg"
                                            >
                                                {estado.nome}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.estado && (
                                    <span className="text-xs font-medium text-rose-500">
                                        {errors.estado}
                                    </span>
                                )}
                            </div>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <label className="text-sm leading-none font-medium">
                                        Cidade *
                                    </label>
                                    <Input
                                        className="h-10 rounded-xl border border-border/70 bg-background px-3 py-2 text-sm shadow-sm transition-all placeholder:text-muted-foreground/55 hover:border-emerald-500/40 focus-visible:ring-4 focus-visible:ring-emerald-500/10 focus-visible:outline-none"
                                        placeholder="São Paulo"
                                        value={data.cidade}
                                        onChange={(e) =>
                                            setData('cidade', e.target.value)
                                        }
                                    />
                                    {errors.cidade && (
                                        <span className="text-xs font-medium text-rose-500">
                                            {errors.cidade}
                                        </span>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm leading-none font-medium">
                                        CEP *
                                    </label>
                                    <Input
                                        className="h-10 rounded-xl border border-border/70 bg-background px-3 py-2 text-sm shadow-sm transition-all placeholder:text-muted-foreground/55 hover:border-emerald-500/40 focus-visible:ring-4 focus-visible:ring-emerald-500/10 focus-visible:outline-none"
                                        type="text"
                                        placeholder="00000-000"
                                        value={data.cep}
                                        onChange={(e) => {
                                            const cepMascarado =
                                                aplicarMascaraCEP(
                                                    e.target.value,
                                                );
                                            setData('cep', cepMascarado);
                                        }}
                                        onBlur={(e) =>
                                            buscarCep(e.target.value)
                                        }
                                    />
                                    {errors.cep && (
                                        <span className="text-xs font-medium text-rose-500">
                                            {errors.cep}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm leading-none font-medium">
                                    Endereço *
                                </label>
                                <Input
                                    className="h-10 rounded-xl border border-border/70 bg-background px-3 py-2 text-sm shadow-sm transition-all placeholder:text-muted-foreground/55 hover:border-emerald-500/40 focus-visible:ring-4 focus-visible:ring-emerald-500/10 focus-visible:outline-none"
                                    placeholder="Avenida Bernardino de Campos"
                                    value={data.endereco}
                                    onChange={(e) =>
                                        setData('endereco', e.target.value)
                                    }
                                />
                                {errors.endereco && (
                                    <span className="text-xs font-medium text-rose-500">
                                        {errors.endereco}
                                    </span>
                                )}
                            </div>
                        </div>
                    </Section>

                    <Section
                        icon={<FileText className="h-4 w-4" />}
                        title="Observações"
                        description="Informações complementares, se necessário"
                    >
                        <textarea
                            value={data.observacoes}
                            onChange={(e) =>
                                setData('observacoes', e.target.value)
                            }
                            className="min-h-24 w-full resize-none rounded-xl border border-border/70 bg-background px-3 py-3 text-sm shadow-sm transition-all placeholder:text-muted-foreground/55 hover:border-emerald-500/40 focus-visible:ring-4 focus-visible:ring-emerald-500/10 focus-visible:outline-none"
                            placeholder="Adicione observações relevantes..."
                        />
                    </Section>
                    {errors.observacoes && (
                        <span className="text-xs font-medium text-rose-500">
                            {errors.observacoes}
                        </span>
                    )}
                </div>

                {/* Correção realizada aqui removendo 'sm:classes' */}
                <div className="flex shrink-0 flex-col-reverse gap-3 border-t border-border/70 bg-background px-6 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-8">
                    <p className="text-xs text-muted-foreground">
                        Campos com{' '}
                        <span className="font-bold text-emerald-600">*</span>{' '}
                        são obrigatórios.
                    </p>
                    <div className="flex gap-3">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => setOpen(false)}
                            className="h-11 rounded-xl px-5"
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={salvarClientes}
                            disabled={processing}
                            className="h-11 rounded-xl bg-emerald-500 px-5 font-bold text-white shadow-lg shadow-emerald-500/20 transition-all hover:bg-emerald-600 active:scale-[0.98]"
                        >
                            {processing ? (
                                'Salvando...'
                            ) : (
                                <>
                                    <Check className="mr-2 h-4 w-4" />
                                    Salvar segurado
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}