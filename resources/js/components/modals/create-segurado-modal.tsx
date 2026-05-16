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
} from "@/components/ui/select";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useEffect, useState } from 'react';
import { useForm } from '@inertiajs/react';

export default function CreateSeguradoModal({ open, setOpen }: any) {
    const [tipoPessoa, setTipoPessoa] = useState("pf");
    const [estados, setEstados] = useState([]);
    const [cidades, setCidades] = useState([]);
    const isPF = tipoPessoa === "pf";
    const labelNome = isPF ? "Nome Completo" : "Nome Fantasia";
    const labelDocumento = isPF ? "CPF" : "CNPJ";
    const labelData = isPF ? "Data de Nascimento" : "Data de Fundação";
    const placeholder = isPF ? "Nome Segurado" : "Nome Empresa";

    const { data, setData, post, processing, errors } = useForm({
        tipo_pessoa: "pf",
        nome_completo: "",
        cpf_cnpj: "",
        data_nascimento_fundacao: "",
        email: "",
        celular_whatsapp: "",
        telefone_fixo: "",
        endereco: "",
        cidade: "",
        estado: "",
        cep: "",
        observacoes: "",
    });

    const buscarEstados = async () => {
        const resposta = await fetch('https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome')
        const dados = await resposta.json();
        setEstados(dados);
    }

    useEffect(() => {
        buscarEstados();
    }, [])

    const salvarCliente = () => {
        post('/clientes', {
            onSuccess: () => setOpen(false),
        });
    };

    return(
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">

                {/* Header */}
                <DialogHeader className="mb-2">
                    <div className="flex items-center gap-2 mb-1">
                        <div className="h-8 w-8 bg-emerald-500 rounded-lg flex items-center justify-center shadow-lg shadow-emerald-500/20">
                            <div className="h-4 w-4 border-2 border-white rounded-sm rotate-45"></div>
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
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Dados Principais
                    </p>

                    <div className="space-y-2">
                        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Tipo Cliente*
                        </label>
                        <Select onValueChange={(valor) => {
                                setTipoPessoa(valor);
                                setData('tipo_pessoa', valor);
                            }}
                            defaultValue={tipoPessoa}
                        >
                            <SelectTrigger className="h-12 border-muted-foreground/20 rounded-xl">
                                <SelectValue placeholder='Selecione PF ou PJ'/>
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value='pf'>Pessoa Física</SelectItem>
                                <SelectItem value='pj'>Pessoa Jurídica</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                {labelNome}*
                            </label>
                            <Input
                                placeholder={placeholder}
                                value={data.nome_completo}
                                onChange={(e) => setData('nome_completo', e.target.value)}
                                className="h-12 border-muted-foreground/20 rounded-xl"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                {labelDocumento}*
                            </label>
                            <Input
                                placeholder='12345678910'
                                value={data.cpf_cnpj}
                                onChange={(e) => setData('cpf_cnpj', e.target.value)}
                                className="h-12 border-muted-foreground/20 rounded-xl"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            {labelData}*
                        </label>
                        <Input
                            type='date'
                            value={data.data_nascimento_fundacao}
                            onChange={(e) => setData('data_nascimento_fundacao', e.target.value)}
                            className="h-12 border-muted-foreground/20 rounded-xl"
                        />
                    </div>
                </div>

                {/* Contato */}
                <div className="space-y-4 mt-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Contato
                    </p>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                Email*
                            </label>
                            <Input
                                placeholder='exemplo@payflow.com'
                                value={data.email}
                                onChange={(e) => setData('email', e.target.value)}
                                className="h-12 border-muted-foreground/20 rounded-xl"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                Celular/WhatsApp*
                            </label>
                            <Input
                                type='tel'
                                placeholder='(11) 99999-9999'
                                value={data.celular_whatsapp}
                                onChange={(e) => setData('celular_whatsapp', e.target.value)}
                                className="h-12 border-muted-foreground/20 rounded-xl"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Telefone Fixo
                        </label>
                        <Input
                            type='tel'
                            placeholder='(11) 3333-3333'
                            value={data.telefone_fixo}
                            onChange={(e) => setData('telefone_fixo', e.target.value)}
                            className="h-12 border-muted-foreground/20 rounded-xl"
                        />
                    </div>
                </div>

                {/* Localização */}
                <div className="space-y-4 mt-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Localização
                    </p>
                    <div className="space-y-2">
                        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Estado*
                        </label>
                        <Select onValueChange={(v) => setData('estado', v)}>
                            <SelectTrigger className="h-12 border-muted-foreground/20 rounded-xl">
                                <SelectValue placeholder='Selecione o Estado' />
                            </SelectTrigger>
                            <SelectContent>
                                {estados.map((estado:any) => (
                                    <SelectItem key={estado.id} value={estado.sigla}>
                                        {estado.nome}
                                    </SelectItem>
                                ))}                             
                            </SelectContent>
                        </Select>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                Cidade*
                            </label>
                            <Input
                                placeholder='São Paulo'
                                value={data.cidade}
                                onChange={(e) => setData('cidade', e.target.value)}
                                className="h-12 border-muted-foreground/20 rounded-xl"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                CEP*
                            </label>
                            <Input
                                placeholder='00000-000'
                                value={data.cep}
                                onChange={(e) => setData('cep', e.target.value)}
                                className="h-12 border-muted-foreground/20 rounded-xl"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Endereço*
                        </label>
                        <Input
                            placeholder='Avenida Bernardino de Campos'
                            value={data.endereco}
                            onChange={(e) => setData('endereco', e.target.value)}
                            className="h-12 border-muted-foreground/20 rounded-xl"
                        />
                    </div>
                </div>

                {/* Observação */}
                <div className="space-y-2 mt-4">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Observação
                    </label>
                    <textarea
                        value={data.observacoes}
                        onChange={(e) => setData('observacoes', e.target.value)}
                        className="w-full min-h-[80px] rounded-xl border border-muted-foreground/20 bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-500 resize-none"
                        placeholder="Observações adicionais..."
                    />
                </div>

                {/* Botões */}
                <div className="flex justify-end gap-2 mt-4">
                    <Button
                        variant="outline"
                        onClick={() => setOpen(false)}
                        className="rounded-xl"
                    >
                        Cancelar
                    </Button>
                    <Button
                        onClick={salvarCliente}
                        disabled={processing}
                        className="h-12 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20 transition-all active:scale-[0.98]"
                    >
                        {processing ? 'Salvando...' : 'Salvar'}
                    </Button>
                </div>

            </DialogContent>
        </Dialog>
    )
}