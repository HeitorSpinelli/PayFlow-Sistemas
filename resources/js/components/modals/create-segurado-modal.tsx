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
import { Input } from '@/components/ui/input';
import { useEffect, useState } from 'react';
import { useForm } from '@inertiajs/react';
import { toast } from 'sonner';
import 'react-toastify/dist/ReactToastify.css';

// --- FUNÇÕES DE MÁSCARA (REGEX) ---
const aplicarMascaraCPFCNPJ = (valor: string, tipo: string) => {
    const num = valor.replace(/\D/g, '');
    if (tipo === 'pf') {
        // CPF: 000.000.000-00
        return num
            .substring(0, 11)
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    } else {
        // CNPJ: 00.000.000/0001-00
        return num
            .substring(0, 14)
            .replace(/(\d{2})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d)/, '$1/$2')
            .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
    }
};

const aplicarMascaraCelular = (valor: string) => {
    const num = valor.replace(/\D/g, '').substring(0, 11);
    if (num.length <= 2) return `(${num}`;
    if (num.length <= 6) return `(${num.substring(0, 2)}) ${num.substring(2)}`;
    return `(${num.substring(0, 2)}) ${num.substring(2, 7)}-${num.substring(7)}`;
};

const aplicarMascaraFixo = (valor: string) => {
    const num = valor.replace(/\D/g, '').substring(0, 10);
    if (num.length <= 2) return `(${num}`;
    if (num.length <= 6) return `(${num.substring(0, 2)}) ${num.substring(2)}`;
    return `(${num.substring(0, 2)}) ${num.substring(2, 6)}-${num.substring(6)}`;
};

const aplicarMascaraCEP = (valor: string) => {
    const num = valor.replace(/\D/g, '').substring(0, 8);
    return num.replace(/(\d{5})(\d)/, '$1-$2');
};

export default function CreateSeguradoModal({ open, setOpen }: any) {
    const [tipoPessoa, setTipoPessoa] = useState('pf');
    const [estados, setEstados] = useState([]);
    const [cidades, setCidades] = useState([]);
    const isPF = tipoPessoa === 'pf';
    const labelNome = isPF ? 'Nome Completo' : 'Nome Fantasia';
    const labelDocumento = isPF ? 'CPF' : 'CNPJ';
    const labelData = isPF ? 'Data de Nascimento' : 'Data de Fundação';
    const placeholder = isPF ? 'Nome Segurado' : 'Nome Empresa';

    const { data, setData, post, processing, errors } = useForm({
        tipo_pessoa: 'pf',
        nome_completo: '',
        cpf_cnpj: '',
        data_nascimento_fundacao: '',
        email: '',
        celular_whatsapp: '',
        telefone_fixo: '',
        endereco: '',
        cidade: '',
        estado: '',
        cep: '',
        observacoes: '',
    });

    const buscarEstados = async () => {
        const resposta = await fetch(
            'https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome',
        );
        const dados = await resposta.json();
        setEstados(dados);
    };

    useEffect(() => {
        buscarEstados();
    }, []);

    const salvarClientes = () => {
        post('/clientes', {
            onSuccess: () => {
                toast.success('Segurado Salvo com Sucesso!');
                setOpen(false);
            },
            onError: () => {
                toast.error('Falha ao Salvar, Verifique os campos');
            },
        });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
                {/* Header */}
                <DialogHeader className="mb-2">
                    <div className="mb-1 flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500 shadow-lg shadow-emerald-500/20">
                            <div className="h-4 w-4 rotate-45 rounded-sm border-2 border-white"></div>
                        </div>
                        <span className="text-sm font-black tracking-tighter text-emerald-600 uppercase italic">
                            PayFlow-Sistemas
                        </span>
                    </div>
                    <DialogTitle className="text-2xl font-bold tracking-tight">
                        Cadastrar Segurado
                    </DialogTitle>
                    <p className="text-sm text-muted-foreground">
                        Preencha todas as informações do segurado
                    </p>
                </DialogHeader>

                {/* Dados Base */}
                <div className="space-y-4">
                    <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                        Dados Principais
                    </p>

                    <div className="space-y-2">
                        <label className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                            Tipo Cliente*
                        </label>
                        <Select
                            onValueChange={(valor) => {
                                setTipoPessoa(valor);
                                setData((prev) => ({
                                    ...prev,
                                    tipo_pessoa: valor,
                                    cpf_cnpj: '', // Limpa o documento para não misturar máscara de CPF com CNPJ
                                }));
                            }}
                            defaultValue={tipoPessoa}
                        >
                            <SelectTrigger className="h-12 rounded-xl border-muted-foreground/20">
                                <SelectValue placeholder="Selecione PF ou PJ" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="pf">
                                    Pessoa Física
                                </SelectItem>
                                <SelectItem value="pj">
                                    Pessoa Jurídica
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                {labelNome}*
                            </label>
                            <Input
                                placeholder={placeholder}
                                value={data.nome_completo}
                                onChange={(e) =>
                                    setData('nome_completo', e.target.value)
                                }
                                className="h-12 rounded-xl border-muted-foreground/20"
                            />
                            {errors.nome_completo && (
                                <span className="text-xs font-medium text-red-500">
                                    {errors.nome_completo}
                                </span>
                            )}
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                {labelDocumento}*
                            </label>
                            <Input
                                placeholder={
                                    isPF
                                        ? '000.000.000-00'
                                        : '00.000.000/0001-00'
                                }
                                value={data.cpf_cnpj}
                                onChange={(e) =>
                                    setData(
                                        'cpf_cnpj',
                                        aplicarMascaraCPFCNPJ(
                                            e.target.value,
                                            tipoPessoa,
                                        ),
                                    )
                                }
                                className="h-12 rounded-xl border-muted-foreground/20"
                            />
                            {errors.cpf_cnpj && (
                                <span className="text-xs font-medium text-red-500">
                                    {errors.cpf_cnpj}
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                            {labelData}*
                        </label>
                        <Input
                            type="date"
                            value={data.data_nascimento_fundacao}
                            max={new Date().toISOString().split('T')[0]}
                            onChange={(e) =>
                                setData(
                                    'data_nascimento_fundacao',
                                    e.target.value,
                                )
                            }
                            className="h-12 rounded-xl border-muted-foreground/20"
                        />
                        {errors.data_nascimento_fundacao && (
                            <span className="text-xs font-medium text-red-500">
                                {errors.data_nascimento_fundacao}
                            </span>
                        )}
                    </div>
                </div>

                {/* Contato */}
                <div className="mt-4 space-y-4">
                    <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                        Contato
                    </p>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                Email*
                            </label>
                            <Input
                                placeholder="exemplo@payflow.com"
                                value={data.email}
                                onChange={(e) =>
                                    setData('email', e.target.value)
                                }
                                className="h-12 rounded-xl border-muted-foreground/20"
                            />
                            {errors.email && (
                                <span className="text-xs font-medium text-red-500">
                                    {errors.email}
                                </span>
                            )}
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                Celular/WhatsApp*
                            </label>
                            <Input
                                type="tel"
                                placeholder="(11) 99999-9999"
                                value={data.celular_whatsapp}
                                onChange={(e) =>
                                    setData(
                                        'celular_whatsapp',
                                        aplicarMascaraCelular(e.target.value),
                                    )
                                }
                                className="h-12 rounded-xl border-muted-foreground/20"
                            />
                            {errors.celular_whatsapp && (
                                <span className="text-xs font-medium text-red-500">
                                    {errors.celular_whatsapp}
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                            Telefone Fixo
                        </label>
                        <Input
                            type="tel"
                            placeholder="(11) 3333-3333"
                            value={data.telefone_fixo}
                            onChange={(e) =>
                                setData(
                                    'telefone_fixo',
                                    aplicarMascaraFixo(e.target.value),
                                )
                            }
                            className="h-12 rounded-xl border-muted-foreground/20"
                        />
                        {errors.telefone_fixo && (
                            <span className="text-xs font-medium text-red-500">
                                {errors.telefone_fixo}
                            </span>
                        )}
                    </div>
                </div>

                {/* Localização */}
                <div className="mt-4 space-y-4">
                    <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                        Localização
                    </p>
                    <div className="space-y-2">
                        <label className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                            Estado*
                        </label>
                        <Select onValueChange={(v) => setData('estado', v)}>
                            <SelectTrigger className="h-12 rounded-xl border-muted-foreground/20">
                                <SelectValue placeholder="Selecione o Estado" />
                            </SelectTrigger>
                            <SelectContent>
                                {estados.map((estado: any) => (
                                    <SelectItem
                                        key={estado.id}
                                        value={estado.sigla}
                                    >
                                        {estado.nome}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors.estado && (
                            <span className="text-xs font-medium text-red-500">
                                {errors.estado}
                            </span>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                Cidade*
                            </label>
                            <Input
                                placeholder="São Paulo"
                                value={data.cidade}
                                onChange={(e) =>
                                    setData('cidade', e.target.value)
                                }
                                className="h-12 rounded-xl border-muted-foreground/20"
                            />
                            {errors.cidade && (
                                <span className="text-xs font-medium text-red-500">
                                    {errors.cidade}
                                </span>
                            )}
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                CEP*
                            </label>
                            <Input
                                placeholder="00000-000"
                                value={data.cep}
                                onChange={(e) =>
                                    setData(
                                        'cep',
                                        aplicarMascaraCEP(e.target.value),
                                    )
                                }
                                className="h-12 rounded-xl border-muted-foreground/20"
                            />
                            {errors.cep && (
                                <span className="text-xs font-medium text-red-500">
                                    {errors.cep}
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                            Endereço*
                        </label>
                        <Input
                            placeholder="Avenida Bernardino de Campos"
                            value={data.endereco}
                            onChange={(e) =>
                                setData('endereco', e.target.value)
                            }
                            className="h-12 rounded-xl border-muted-foreground/20"
                        />
                        {errors.endereco && (
                            <span className="text-xs font-medium text-red-500">
                                {errors.endereco}
                            </span>
                        )}
                    </div>
                </div>

                {/* Observação */}
                <div className="mt-4 space-y-2">
                    <label className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                        Observação
                    </label>
                    <textarea
                        value={data.observacoes}
                        onChange={(e) => setData('observacoes', e.target.value)}
                        className="min-h-[80px] w-full resize-none rounded-xl border border-muted-foreground/20 bg-background px-3 py-2 text-sm focus-visible:ring-1 focus-visible:ring-emerald-500 focus-visible:outline-none"
                        placeholder="Observações adicionais..."
                    />
                    {errors.observacoes && (
                        <span className="text-xs font-medium text-red-500">
                            {errors.observacoes}
                        </span>
                    )}
                </div>

                {/* Botões */}
                <div className="mt-4 flex justify-end gap-2">
                    <Button
                        onClick={salvarClientes}
                        disabled={processing}
                        className="h-12 rounded-xl bg-emerald-500 font-bold text-white shadow-lg shadow-emerald-500/20 transition-all hover:bg-emerald-600 active:scale-[0.98]"
                    >
                        {processing ? 'Salvando...' : 'Salvar'}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
