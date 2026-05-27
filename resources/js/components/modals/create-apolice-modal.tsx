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
import ApolicesController from '@/actions/App/Http/Controllers/ApolicesController';

export default function CreateApoliceModal({ open, setOpen, clientes }: any) {
    const { data, setData, post } = useForm({
        numero_apolice: "",
        cliente_id: "",
        seguradora_id: "",
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

    const [busca, setBusca] = useState('')
    const [clienteEncontrado, setClienteEncontrado] = useState<any>(null)

    const buscarCliente = (valorDigitado: string) => {
        const apenasNumeros = valorDigitado.replace(/\D/g, '');

        if (apenasNumeros.length !== 11 && apenasNumeros.length !== 14) {
            setClienteEncontrado(null);
            return;
        }

        const encontrado = clientes.find((cliente: any) =>
            cliente.cpf_cnpj.replace(/\D/g, '') === apenasNumeros
        );

        if (encontrado) {
            setClienteEncontrado(encontrado);
            setData('cliente_id', encontrado.id);
        } else {
            setClienteEncontrado(null);
        }
    };

    return (
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
                        Cadastrar Apólice
                    </DialogTitle>
                    <p className="text-sm text-muted-foreground">
                        Preencha os dados da apólice para cadastrá-la no sistema
                    </p>
                </DialogHeader>

                {/* Dados da Apólice */}
                <div className="space-y-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Dados da Apólice
                    </p>

                    <div className="space-y-2">
                        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Cliente*
                        </label>
                        <Input
                            type="text"
                            placeholder="Digite o CPF ou CNPJ"
                            value={busca}
                            className="h-12 border-muted-foreground/20 rounded-xl"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Número da Apólice*
                        </label>
                        <Input
                            type="text"
                            placeholder="Ex: 000123"
                            value={data.numero_apolice}
                            onChange={(e) => setData('numero_apolice', e.target.value)}
                            className="h-12 border-muted-foreground/20 rounded-xl"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                Seguradora*
                            </label>
                            <Select onValueChange={(v) => setData('forma_pagamento', v)}>
                                <SelectTrigger className="h-12 border-muted-foreground/20 rounded-xl">
                                    <SelectValue placeholder="Selecione" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Porto Seguro">Porto Seguro</SelectItem>
                                    <SelectItem value="Tokio Marine">Tokio Marine</SelectItem>
                                    <SelectItem value="Bradesco">Bradesco</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                Ramo*
                            </label>
                            <Select onValueChange={(v) => setData('forma_pagamento', v)}>
                                <SelectTrigger className="h-12 border-muted-foreground/20 rounded-xl">
                                    <SelectValue placeholder="Selecione" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Porto Seguro">Porto Seguro</SelectItem>
                                    <SelectItem value="Tokio Marine">Tokio Marine</SelectItem>
                                    <SelectItem value="Bradesco">Bradesco</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>

                {/* Vigência */}
                <div className="space-y-4 mt-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Vigência
                    </p>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                Início da Vigência*
                            </label>
                            <Input
                                type="date"
                                value={data.inicio_vigencia}
                                onChange={(e) => setData('inicio_vigencia', e.target.value)}
                                className="h-12 border-muted-foreground/20 rounded-xl"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                Fim da Vigência*
                            </label>
                            <Input
                                type="date"
                                value={data.fim_vigencia}
                                onChange={(e) => setData('fim_vigencia', e.target.value)}
                                className="h-12 border-muted-foreground/20 rounded-xl"
                            />
                        </div>
                    </div>
                </div>

                {/* Valores e Pagamento */}
                <div className="space-y-4 mt-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Valores e Pagamento
                    </p>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                Valor do Prêmio*
                            </label>
                            <Input
                                type="number"
                                placeholder="R$ 0,00"
                                value={data.valor_premio_total}
                                onChange={(e) => setData('valor_premio_total', e.target.value)}
                                className="h-12 border-muted-foreground/20 rounded-xl"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                Valor de Cobertura*
                            </label>
                            <Input
                                type="number"
                                placeholder="R$ 0,00"
                                value={data.valor_cobertura}
                                onChange={(e) => setData('valor_cobertura', e.target.value)}
                                className="h-12 border-muted-foreground/20 rounded-xl"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                Quantidade de Parcelas*
                            </label>
                            <Input
                                type="number"
                                placeholder="12"
                                value={data.quantidade_parcelas}
                                onChange={(e) => setData('quantidade_parcelas', e.target.value)}
                                className="h-12 border-muted-foreground/20 rounded-xl"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                Forma de Pagamento*
                            </label>
                            <Select onValueChange={(v) => setData('forma_pagamento', v)}>
                                <SelectTrigger className="h-12 border-muted-foreground/20 rounded-xl">
                                    <SelectValue placeholder="Selecione" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="boleto">Boleto</SelectItem>
                                    <SelectItem value="cartao">Cartão</SelectItem>
                                    <SelectItem value="pix">Pix</SelectItem>
                                    <SelectItem value="debito">Débito Automático</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
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
                        className="h-12 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20 transition-all active:scale-[0.98]"
                    >
                        Cadastrar Apólice
                    </Button>
                </div>

            </DialogContent>
        </Dialog>
    );
}