
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
import { useState } from 'react';
import { useForm } from '@inertiajs/react';
import { ESTADOS_BR } from '@/constants/estados';

export default function CreateSeguradoModal({ open, setOpen }: any) {
    const [tipoCliente, setTipoCliente] = useState("pf");

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

    const alterarTipo = (valor: string) => {
        setTipoCliente(valor);
        setData('tipo_pessoa', valor);
    }

    const salvarCliente = () => {
        post('/clientes', {
            onSuccess: () => setOpen(false),
        });
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Cadastrar Cliente</DialogTitle>
                </DialogHeader>

                <div className="grid w-full items-center gap-4 py-4">
                    {tipoCliente === "pf" && (
                        <>
                            <div className="col-span-2">
                                <p>Nome Completo *</p>
                                <Input 
                                    placeholder="Digite o nome completo" 
                                    value={data.nome_completo}
                                    onChange={(e) => setData('nome_completo', e.target.value)}
                                />
                            </div>

                            <div>
                                <p>Data de Nascimento *</p>
                                <Input 
                                    type="date" 
                                    value={data.data_nascimento_fundacao}
                                    onChange={(e) => setData('data_nascimento_fundacao', e.target.value)}
                                />
                            </div>

                            <div>
                                <p>CPF *</p>
                                <Input 
                                    placeholder="Digite o CPF" 
                                    value={data.cpf_cnpj}
                                    onChange={(e) => setData('cpf_cnpj', e.target.value)}
                                />
                            </div>
                        </>
                    )}
                    {tipoCliente === "pj" && (
                        <>
                            <div className="col-span-2">
                                <p>Nome Fantasia *</p>
                                <Input 
                                    placeholder="Digite o nome fantasia" 
                                    value={data.nome_completo}
                                    onChange={(e) => setData('nome_completo', e.target.value)}
                                />
                            </div>

                            <div>
                                <p>Data de Fundação *</p>
                                <Input 
                                    type="date" 
                                    value={data.data_nascimento_fundacao}
                                    onChange={(e) => setData('data_nascimento_fundacao', e.target.value)}
                                />
                            </div>

                            <div>
                                <p>CNPJ *</p>
                                <Input 
                                    placeholder="Digite o CNPJ" 
                                    value={data.cpf_cnpj}
                                    onChange={(e) => setData('cpf_cnpj', e.target.value)}
                                />
                            </div>
                        </>
                    )}
                    
                    <div className="col-span-2">
                        <p>Tipo *</p>
                        <Select onValueChange={alterarTipo} value='data.tipo_pessoa'>
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Selecione o tipo" />
                            </SelectTrigger>

                            <SelectContent>
                                <SelectItem value="pf">Pessoa Física</SelectItem>
                                <SelectItem value="pj">Pessoa Jurídica</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex flex-col space-y-1.5">
                        <p>Celular WhastApp *</p>
                        <Input 
                            placeholder="Digite o celular/WhatsApp" 
                            value={data.celular_whatsapp}
                            onChange={(e) => setData('celular_whatsapp', e.target.value)}
                        />
                    </div>
                    <div className="flex flex-col space-y-1.5">
                        <p>Telefone Fixo *</p>
                        <Input 
                            placeholder="Digite o celular/WhatsApp" 
                            value={data.telefone_fixo}
                            onChange={(e) => setData('telefone_fixo', e.target.value)}
                        />
                    </div>
                    <SelectContent>
                        {ESTADOS_BR.map((estado) => (
                            <SelectItem key={estado.sigla} value={estado.sigla}>
                                {estado.sigla} - {estado.nome}
                            </SelectItem>
                        ))}
                    </SelectContent>
                    <div className="flex flex-col space-y-1.5">
                        <p>Endereço *</p>
                        <Input 
                            placeholder="Digite o endereço" 
                            value={data.endereco}
                            onChange={(e) => setData('endereco', e.target.value)}
                        />
                    </div>
                    <div className="flex flex-col space-y-1.5">
                        <p>Cidade</p>
                        <Input 
                            placeholder="Digite a cidade" 
                            value={data.cidade}
                            onChange={(e) => setData('cidade', e.target.value)}
                        />
                    </div>
                    <div className="flex flex-col space-y-1.5">
                        <p>CEP</p>
                        <Input 
                            placeholder="Digite o CEP" 
                            value={data.cep}
                            onChange={(e) => setData('cep', e.target.value)}
                        />
                    </div>
                    <div className="flex flex-col space-y-1.5">
                        <p>Email *</p>
                        <Input 
                            placeholder="Digite o email" 
                            value={data.email}
                            onChange={(e) => setData('email', e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex w-full items-center justify-end space-x-2">
                    <Button onClick={salvarCliente}>
                        Salvar
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}