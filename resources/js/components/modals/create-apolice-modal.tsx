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

export default function CreateApoliceModal({ open, setOpen, segurados }: any) {

    // Estados
    const [busca, setBusca] = useState('');
    const [mostrarLista, setMostrarLista] = useState(false);
    const [seguradoEncontrado, setSeguradoEncontrado] = useState<any>(null);

    // Formulário
    const { data, setData, post } = useForm({
        numero_apolice:      "",
        cliente_id:          "",
        seguradora_id:       "",
        ramo_id:             "",
        valor_premio_total:  "",
        valor_cobertura:     "",
        quantidade_parcelas: "",
        forma_pagamento:     "",
        inicio_vigencia:     "",
        fim_vigencia:        "",
        status:              "",
        observacoes:         "",
    });

    // Remove caracteres especiais deixando só números
    const apenasNumeros = (str: string) => str.replace(/\D/g, '');

    // Filtra segurados conforme digitação
    const resultados = busca.length > 0
        ? segurados.filter((segurado: any) =>
            apenasNumeros(segurado.cpf_cnpj).includes(apenasNumeros(busca)) ||
            segurado.nome_completo.toLowerCase().includes(busca.toLowerCase())
        )
        : [];

    // Seleciona o segurado ao clicar na lista
    const selecionarSegurado = (segurado: any) => {
        setSeguradoEncontrado(segurado);
        setData('cliente_id', segurado.id);
        setBusca(segurado.nome_completo);
        setMostrarLista(false);
    };

    // Envia o formulário
    const salvarApolice = () => {
        post('/apolices', {
            onSuccess: () => setOpen(false),
        });
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

                    {/* Campo de busca de segurado */}
                    <div className="space-y-2 relative">
                        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Cliente*
                        </label>
                        <Input
                            placeholder="Busque pelo nome ou CPF/CNPJ"
                            value={busca}
                            onChange={(e) => {
                                setBusca(e.target.value);
                                setMostrarLista(true);
                            }}
                            className="h-12 border-muted-foreground/20 rounded-xl"
                        />

                        {/* Lista de resultados */}
                        {mostrarLista && resultados.length > 0 && (
                            <div className="absolute z-50 w-full mt-1 border border-muted-foreground/20 rounded-xl bg-background shadow-lg overflow-hidden">
                                {resultados.map((segurado: any) => (
                                    <div
                                        key={segurado.id}
                                        onClick={() => selecionarSegurado(segurado)}
                                        className="px-4 py-3 hover:bg-muted cursor-pointer flex justify-between items-center"
                                    >
                                        <span className="font-medium text-sm">{segurado.nome_completo}</span>
                                        <span className="text-xs text-muted-foreground">{segurado.cpf_cnpj}</span>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Nenhum resultado */}
                        {mostrarLista && busca.length > 0 && resultados.length === 0 && (
                            <p className="text-sm text-red-500">Nenhum cliente encontrado</p>
                        )}
                    </div>

                    {/* Número da apólice */}
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
                            <Select onValueChange={(v) => setData('seguradora_id', v)}>
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
                            <Select onValueChange={(v) => setData('ramo_id', v)}>
                                <SelectTrigger className="h-12 border-muted-foreground/20 rounded-xl">
                                    <SelectValue placeholder="Selecione" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Auto">Auto</SelectItem>
                                    <SelectItem value="Vida">Vida</SelectItem>
                                    <SelectItem value="Residencial">Residencial</SelectItem>
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
                        variant="outline"
                        onClick={() => setOpen(false)}
                        className="rounded-xl"
                    >
                        Cancelar
                    </Button>
                    <Button
                        onClick={salvarApolice}
                        className="h-12 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20 transition-all active:scale-[0.98]"
                    >
                        Cadastrar Apólice
                    </Button>
                </div>

            </DialogContent>
        </Dialog>
    );
}