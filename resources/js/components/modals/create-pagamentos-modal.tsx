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
import { useForm } from '@inertiajs/react';
import { Search, Check } from 'lucide-react';

export default function CreatePagamentoModal({ open, setOpen, clientes, apolices }: any) {
    const { data, setData, post, reset } = useForm({
        cliente_id: "",
        apolice_id: "",
        parcela: "",
        valor: "",
        data_pagamento: "",
        forma_pagamento: "",
        status: "",
        observacoes: "",
    });

    const apenasNumeros = (str: string) => str.replace(/\D/g, '');

    const buscarCliente = (valor: string) => {
        const numeros = apenasNumeros(valor);
        if (numeros.length !== 11 && numeros.length !== 14) {
            setData('cliente_id', '');
            return;
        }
        const encontrado = clientes?.find((c: any) =>
            apenasNumeros(c.cpf ?? '') === numeros ||
            apenasNumeros(c.cnpj ?? '') === numeros
        );
        setData('cliente_id', encontrado?.id ?? '');
    };

    const handleSubmit = () => {
        post('/pagamentos', {
            onSuccess: () => {
                reset();
                setOpen(false);
            },
        });
    };

    const btnBase = "flex items-center gap-1.5 h-9 px-3 rounded-md border text-sm font-medium transition-colors";
    const btnAtivo = `${btnBase} border-[#2D5A43] bg-[#2D5A43]/10 text-[#2D5A43]`;
    const btnInativo = `${btnBase} border-sidebar-border bg-background text-foreground hover:bg-muted`;

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>Registrar Pagamento</DialogTitle>
                    <p className="text-sm text-muted-foreground">
                        Preencha os dados do pagamento para registrá-lo no sistema
                    </p>
                </DialogHeader>

                <div className="flex flex-col gap-4 py-2">

                    <div className="flex flex-col gap-1">
                        <p className="text-sm font-medium">Cliente *</p>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                            <Input
                                placeholder="Digite o CPF ou CNPJ"
                                className="pl-9"
                                onChange={(e) => buscarCliente(e.target.value)}
                            />
                        </div>
                        {data.cliente_id
                            ? <p className="text-sm text-green-600">✓ {clientes?.find((c: any) => c.id === data.cliente_id)?.nome}</p>
                            : null
                        }
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="flex flex-col gap-1">
                            <p className="text-sm font-medium">Apólice *</p>
                            <Select onValueChange={(v) => setData('apolice_id', v)}>
                                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                                <SelectContent>
                                    {apolices?.map((a: any) => (
                                        <SelectItem key={a.id} value={String(a.id)}>{a.numero_apolice}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex flex-col gap-1">
                            <p className="text-sm font-medium">Parcela *</p>
                            <Select onValueChange={(v) => setData('parcela', v)}>
                                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                                <SelectContent>
                                    {[1,2,3,4,5,6,7,8,9,10,11,12].map((n) => (
                                        <SelectItem key={n} value={String(n)}>{n}ª Parcela</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="flex flex-col gap-1">
                            <p className="text-sm font-medium">Valor (R$) *</p>
                            <Input
                                type="number"
                                placeholder="0,00"
                                onChange={(e) => setData('valor', e.target.value)}
                            />
                        </div>
                        <div className="flex flex-col gap-1">
                            <p className="text-sm font-medium">Data do Pagamento *</p>
                            <Input
                                type="date"
                                onChange={(e) => setData('data_pagamento', e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="flex flex-col gap-1">
                        <p className="text-sm font-medium">Forma de Pagamento *</p>
                        <div className="flex flex-wrap gap-2">
                            {['Boleto', 'Pix', 'Cartão', 'Débito'].map((forma) => (
                                <button
                                    key={forma}
                                    type="button"
                                    onClick={() => setData('forma_pagamento', forma.toLowerCase())}
                                    className={data.forma_pagamento === forma.toLowerCase() ? btnAtivo : btnInativo}
                                >
                                    {data.forma_pagamento === forma.toLowerCase() && <Check className="size-3.5" />}
                                    {forma}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex flex-col gap-1">
                        <p className="text-sm font-medium">Status *</p>
                        <div className="flex gap-2">
                            {['Confirmado', 'Pendente'].map((status) => (
                                <button
                                    key={status}
                                    type="button"
                                    onClick={() => setData('status', status.toLowerCase())}
                                    className={data.status === status.toLowerCase() ? btnAtivo : btnInativo}
                                >
                                    {data.status === status.toLowerCase() && <Check className="size-3.5" />}
                                    {status}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex flex-col gap-1">
                        <p className="text-sm font-medium">Observações</p>
                        <textarea
                            rows={2}
                            placeholder="Informações adicionais..."
                            onChange={(e) => setData('observacoes', e.target.value)}
                            className="w-full rounded-md border border-sidebar-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
                        />
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                        <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                        <Button onClick={handleSubmit}>
                            <Check className="size-4" />
                            Registrar Pagamento
                        </Button>
                    </div>

                </div>
            </DialogContent>
        </Dialog>
    );
}
