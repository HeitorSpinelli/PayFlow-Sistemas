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

export default function CreateClientModal({ open, setOpen }: any) {
    const [tipoCliente, setTipoCliente] = useState("pf");

    const { data, setData, post, processing, errors } = useForm({
        tipo_pessoa: "pf",
        nome_completo: "",
        email: "",
        telefone: "",
        cpf_cnpj: "",
        data_nascimento_fundacao: "",
        endereco: "",
        cidade: "",
        estado: "",
        cep: "",
    });

    const alterarTipo = (valor: string) => {
        setTipoCliente(valor);
        setData('tipo_pessoa', valor);
    };

    const salvarCliente = () => {
        post(('/Clientes/Salvar'), {
            onSuccess: () => setOpen(false),
        });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Cadastrar Cliente</DialogTitle>
                    <p className="text-sm text-muted-foreground">
                        Preencha os dados do cliente para cadastrá-lo no sistema
                    </p>
                </DialogHeader>

                <div className="grid w-full items-center gap-4 py-4">

                    {/* Tipo de cliente */}
                    <div className="flex flex-col gap-1">
                        <p>Tipo *</p>
                        <Select onValueChange={alterarTipo} defaultValue={tipoCliente}>
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Selecione o tipo" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="pf">Pessoa Física</SelectItem>
                                <SelectItem value="pj">Pessoa Jurídica</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Nome — muda o label conforme o tipo */}
                    <div className="flex flex-col gap-1">
                        <p>{tipoCliente === "pf" ? "Nome Completo" : "Nome Fantasia"} *</p>
                        <Input
                            placeholder={tipoCliente === "pf" ? "Digite o nome completo" : "Digite o nome fantasia"}
                            value={data.nome_completo}
                            onChange={(e) => setData('nome_completo', e.target.value)}
                        />
                        {errors.nome_completo && <p className="text-sm text-red-500">{errors.nome_completo}</p>}
                    </div>

                    {/* CPF ou CNPJ — muda conforme o tipo */}
                    <div className="flex flex-col gap-1">
                        <p>{tipoCliente === "pf" ? "CPF" : "CNPJ"} *</p>
                        <Input
                            placeholder={tipoCliente === "pf" ? "Digite o CPF" : "Digite o CNPJ"}
                            value={data.cpf_cnpj}
                            onChange={(e) => setData('cpf_cnpj', e.target.value)}
                        />
                        {errors.cpf_cnpj && <p className="text-sm text-red-500">{errors.cpf_cnpj}</p>}
                    </div>

                    {/* Data — muda o label conforme o tipo */}
                    <div className="flex flex-col gap-1">
                        <p>{tipoCliente === "pf" ? "Data de Nascimento" : "Data de Fundação"} *</p>
                        <Input
                            type="date"
                            value={data.data_nascimento_fundacao}
                            onChange={(e) => setData('data_nascimento_fundacao', e.target.value)}
                        />
                        {errors.data_nascimento_fundacao && <p className="text-sm text-red-500">{errors.data_nascimento_fundacao}</p>}
                    </div>

                    {/* Contato */}
                    <div className="flex flex-col gap-1">
                        <p>Celular/WhatsApp *</p>
                        <Input
                            placeholder="Digite o celular/WhatsApp"
                            value={data.telefone}
                            onChange={(e) => setData('telefone', e.target.value)}
                        />
                        {errors.telefone && <p className="text-sm text-red-500">{errors.telefone}</p>}
                    </div>

                    <div className="flex flex-col gap-1">
                        <p>Email *</p>
                        <Input
                            placeholder="Digite o email"
                            value={data.email}
                            onChange={(e) => setData('email', e.target.value)}
                        />
                        {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
                    </div>

                    {/* Endereço */}
                    <div className="flex flex-col gap-1">
                        <p>Endereço</p>
                        <Input
                            placeholder="Digite o endereço"
                            value={data.endereco}
                            onChange={(e) => setData('endereco', e.target.value)}
                        />
                    </div>

                    <div className="flex flex-col gap-1">
                        <p>Cidade</p>
                        <Input
                            placeholder="Digite a cidade"
                            value={data.cidade}
                            onChange={(e) => setData('cidade', e.target.value)}
                        />
                    </div>

                    <div className="flex flex-col gap-1">
                        <p>Estado</p>
                        <Select onValueChange={(v) => setData('estado', v)} defaultValue={data.estado}>
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Selecione o Estado" />
                            </SelectTrigger>
                            <SelectContent className="max-h-60 overflow-auto">
                                {["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT",
                                  "MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO",
                                  "RR","SC","SP","SE","TO"].map((uf) => (
                                    <SelectItem key={uf} value={uf}>{uf}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex flex-col gap-1">
                        <p>CEP</p>
                        <Input
                            placeholder="Digite o CEP"
                            value={data.cep}
                            onChange={(e) => setData('cep', e.target.value)}
                        />
                    </div>

                </div>

                <div className="flex w-full items-center justify-end space-x-2">
                    <Button variant="outline" onClick={() => setOpen(false)} disabled={processing}>
                        Cancelar
                    </Button>
                    <Button onClick={salvarCliente} disabled={processing}>
                        {processing ? 'Salvando...' : 'Salvar'}
                    </Button>
                </div>

            </DialogContent>
        </Dialog>
    );
}

export { CreateClientModal };