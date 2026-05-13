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
import { useState } from 'react';
import { useForm } from '@inertiajs/react';
import { Input } from '@/components/ui/input';

export default function CreateClientModal({ open, setOpen }: any) {
    const [tipoCliente, setTipoCliente] = useState("pf");
    const { data, setData, post } = useForm({
    tipo_cliente: "pf",
    nome: "",
    email: "",
    telefone: "",
    cpf: "",
    data_nascimento: "",
    cnpj: "",
    data_fundacao: "",
    endereco: "",
    cidade: "",
    cep: ""
});

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
                                    value={data.nome}
                                    onChange={(e) => setData('nome', e.target.value)}
                                />
                            </div>

                            <div>
                                <p>Data de Nascimento *</p>
                                <Input 
                                    type="date" 
                                    value={data.data_nascimento}
                                    onChange={(e) => setData('data_nascimento', e.target.value)}
                                />
                            </div>

                            <div>
                                <p>CPF *</p>
                                <Input 
                                    placeholder="Digite o CPF" 
                                    value={data.cpf}
                                    onChange={(e) => setData('cpf', e.target.value)}
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
                                    value={data.nome}
                                    onChange={(e) => setData('nome', e.target.value)}
                                />
                            </div>

                            <div>
                                <p>Data de Fundação *</p>
                                <Input 
                                    type="date" 
                                    value={data.data_fundacao}
                                    onChange={(e) => setData('data_fundacao', e.target.value)}
                                />
                            </div>

                            <div>
                                <p>CNPJ *</p>
                                <Input 
                                    placeholder="Digite o CNPJ" 
                                    value={data.cnpj}
                                    onChange={(e) => setData('cnpj', e.target.value)}
                                />
                            </div>
                        </>
                    )}
                    
                    <div className="col-span-2">
                        <p>Tipo *</p>
                        <Select onValueChange={setTipoCliente} defaultValue={tipoCliente}>
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
                        <p>Celular/WhastApp *</p>
                        <Input 
                            placeholder="Digite o celular/WhatsApp" 
                            value={data.telefone}
                            onChange={(e) => setData('telefone', e.target.value)}
                        />
                    </div>
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
                    <Button>
                        Salvar
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
export { CreateClientModal };