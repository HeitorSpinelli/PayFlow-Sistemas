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

export default function CreateApoliceModal({ open, setOpen, clientes }: any) {
    const [cliente, setCliente] = useState<any>(null);
    const [busca, setBusca] = useState('');

    const { data, setData, post } = useForm({
        numero_apolice: "",
        cliente_id: "",
        seguradora_id: "",  // ← ID da seguradora, não o nome
        ramo_id: "",
        valor_premio_total: "",
        valor_cobertura: "",
        quantidade_parcelas: "",
        forma_pagamento: "",
        inicio_vigencia: "",
        fim_vigencia: "",
        status: "",
        observacoes: "",
    });

    // Remove tudo que não for número
    const apenasNumeros = (str: string) => str.replace(/\D/g, '');

    const buscarCliente = (valor: string) => {
        const numeros = apenasNumeros(valor);

        // Só busca quando tiver 11 (CPF) ou 14 (CNPJ) dígitos
        if (numeros.length !== 11 && numeros.length !== 14) {
            setCliente(null);
            return;
        }

        // Busca nos clientes que vieram como prop do Inertia
        const encontrado = clientes.find((c: any) =>
            apenasNumeros(c.cpf ?? '') === numeros ||
            apenasNumeros(c.cnpj ?? '') === numeros
        );

        setCliente(encontrado || null);

        // Se encontrou, já preenche o cliente_id no formulário
        if (encontrado) setData('cliente_id', encontrado.id);
    };

    const handleSubmit = () => {
        post('/apolices', {
            onSuccess: () => setOpen(false),
        });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Cadastrar Apólice</DialogTitle>
                    <p className="text-sm text-muted-foreground">
                        Preencha os dados da apólice para cadastrá-la no sistema
                    </p>
                </DialogHeader>

                <div className="grid w-full items-center gap-4 py-4">

                    {/* Campo de busca de cliente */}
                    <div className="flex flex-col gap-1">
                        <p>Cliente*</p>
                        <Input
                            type="text"
                            placeholder="Digite o CPF ou CNPJ"
                            value={busca}
                            onChange={(e) => {
                                setBusca(e.target.value);
                                buscarCliente(e.target.value);
                            }}
                        />
                        {/* Feedback da busca */}
                        {cliente && (
                            <p className="text-sm text-green-600">✓ {cliente.nome}</p>
                        )}
                        {!cliente && apenasNumeros(busca).length >= 11 && (
                            <p className="text-sm text-red-500">Cliente não encontrado</p>
                        )}
                    </div>

                    {/* Número da apólice */}
                    <div className="flex flex-col gap-1">
                        <p>Número da Apólice*</p>
                        <Input
                            type="text"
                            placeholder="Ex: 000123"
                            value={data.numero_apolice}
                            onChange={(e) => setData('numero_apolice', e.target.value)}
                        />
                    </div>

                    {/* Início e fim de vigência */}
                    <div className="grid grid-cols-2 gap-2">
                        <div className="flex flex-col gap-1">
                            <p>Início da Vigência*</p>
                            <Input
                                type="date"
                                value={data.inicio_vigencia}
                                onChange={(e) => setData('inicio_vigencia', e.target.value)}
                            />
                        </div>
                        <div className="flex flex-col gap-1">
                            <p>Fim da Vigência*</p>
                            <Input
                                type="date"
                                value={data.fim_vigencia}
                                onChange={(e) => setData('fim_vigencia', e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Valores */}
                    <div className="grid grid-cols-2 gap-2">
                        <div className="flex flex-col gap-1">
                            <p>Valor do Prêmio*</p>
                            <Input
                                type="number"
                                placeholder="R$ 0,00"
                                value={data.valor_premio_total}
                                onChange={(e) => setData('valor_premio_total', e.target.value)}
                            />
                        </div>
                        <div className="flex flex-col gap-1">
                            <p>Valor de Cobertura*</p>
                            <Input
                                type="number"
                                placeholder="R$ 0,00"
                                value={data.valor_cobertura}
                                onChange={(e) => setData('valor_cobertura', e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Forma de pagamento */}
                    <div className="flex flex-col gap-1">
                        <p>Forma de Pagamento*</p>
                        <Select onValueChange={(v) => setData('forma_pagamento', v)}>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="boleto">Boleto</SelectItem>
                                <SelectItem value="cartao">Cartão</SelectItem>
                                <SelectItem value="pix">Pix</SelectItem>
                                <SelectItem value="debito">Débito Automático</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>s

                    <Button onClick={handleSubmit} className="w-full">
                        Cadastrar Apólice
                    </Button>

                </div>
            </DialogContent>
        </Dialog>
    );
}