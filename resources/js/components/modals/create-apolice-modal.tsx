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
import { formataCpfCnpj } from '@/utils/cpfMask';
import { toast } from 'sonner';
import { useEffect, useState } from 'react';
import { useForm } from '@inertiajs/react';

export default function CreateApoliceModal({
    open,
    setOpen,
    segurados = [],
    ramos = [],
    seguradoras = [],
}: any) {
    // Estados
    const [busca, setBusca] = useState('');
    const [mostrarLista, setMostrarLista] = useState(false);
    const [seguradoSelecionado, setSeguradoSelecionado] = useState<any>(null);

    // Formulário do Inertia
    const { data, setData, post, errors, reset, clearErrors } = useForm({
        numero_apolice: '',
        cliente_id: '',
        seguradora_id: '',
        ramo_id: '',
        valor_premio_total: '',
        valor_cobertura: '',
        quantidade_parcelas: '',
        forma_pagamento: '',
        inicio_vigencia: '',
        fim_vigencia: '',
        status: '',
        observacoes: '',
    });

    useEffect(() => {
        if (!open) {
            reset();
            clearErrors();
            setBusca('');
            setSeguradoSelecionado(null);
            setMostrarLista(false);
        }
    }, [open]);

    // Filtra os segurados com base na busca (protegido contra cpf_cnpj nulo)
    const resultados = segurados.filter((segurado: any) => {
        const termoBusca = busca.toLowerCase();
        return (
            segurado.nome_completo?.toLowerCase().includes(termoBusca) ||
            segurado.cpf_cnpj?.includes(termoBusca)
        );
    });

    // Atualiza o estado da busca — se o texto não bater mais com o cliente
    // selecionado, invalida a seleção para não salvar o cliente errado
    const handleBuscaChange = (e: any) => {
        const valor = e.target.value;
        setBusca(valor);
        setMostrarLista(true);

        if (
            seguradoSelecionado &&
            valor !== seguradoSelecionado.nome_completo
        ) {
            setSeguradoSelecionado(null);
            setData('cliente_id', '');
        }
    };

    // Seleciona um segurado da lista
    const selecionarSegurado = (segurado: any) => {
        setSeguradoSelecionado(segurado);
        setData('cliente_id', segurado.id);
        setMostrarLista(false);
        setBusca(segurado.nome_completo);
    };

    // Troca de seguradora invalida o ramo já selecionado (ele pertence à seguradora anterior)
    const handleSeguradoraChange = (v: string) => {
        setData((prev) => ({
            ...prev,
            seguradora_id: v,
            ramo_id: '',
        }));
    };

    // Envia o formulário
    const salvarApolice = () => {
        post('/apolices', {
            onSuccess: () => {
                toast.success('Apólice salva com sucesso!');
                setOpen(false);
            },
            onError: () => {
                toast.error('Falha ao salvar. Verifique os campos.');
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
                        Cadastrar Apólice
                    </DialogTitle>
                    <p className="text-sm text-muted-foreground">
                        Preencha os dados da apólice para cadastrá-la no sistema
                    </p>
                </DialogHeader>

                {/* Dados da Apólice */}
                <div className="space-y-4">
                    <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                        Dados da Apólice
                    </p>

                    {/* Campo de busca de segurado */}
                    <div className="relative space-y-2">
                        <label className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                            Cliente*
                        </label>
                        <Input
                            type="text"
                            placeholder="Buscar por nome, CPF ou CNPJ..."
                            value={busca}
                            onChange={handleBuscaChange}
                            onFocus={() =>
                                setMostrarLista(busca.trim().length > 0)
                            }
                            onBlur={() =>
                                setTimeout(() => setMostrarLista(false), 150)
                            }
                            className="h-12 w-full rounded-xl border-muted-foreground/20"
                        />

                        {/* Lista de resultados — só aparece com algo digitado */}
                        {mostrarLista &&
                            busca.trim().length > 0 &&
                            resultados.length > 0 && (
                                <div className="absolute z-50 mt-1 w-full overflow-hidden rounded-xl border border-muted-foreground/20 bg-background shadow-lg">
                                    {resultados.map((segurado: any) => (
                                        <div
                                            key={segurado.id}
                                            onMouseDown={() =>
                                                selecionarSegurado(segurado)
                                            }
                                            className="flex cursor-pointer items-center justify-between gap-3 px-4 py-3 hover:bg-muted"
                                        >
                                            <span className="text-sm text-muted-foreground">
                                                {segurado.tipo_pessoa === 'pf'
                                                    ? 'CPF'
                                                    : 'CNPJ'}
                                            </span>
                                            <span className="text-sm font-medium">
                                                {segurado.nome_completo}
                                            </span>
                                            <span className="text-xs text-muted-foreground">
                                                {segurado.cpf_cnpj
                                                    ? formataCpfCnpj(
                                                          segurado.cpf_cnpj,
                                                      )
                                                    : '-'}
                                            </span>
                                            <span className="text-sm text-muted-foreground">
                                                {segurado.status}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        {/* Nenhum resultado */}
                        {mostrarLista &&
                            busca.length > 0 &&
                            resultados.length === 0 && (
                                <p className="text-sm text-red-500">
                                    Nenhum cliente encontrado
                                </p>
                            )}
                        {errors.cliente_id && (
                            <span className="text-xs font-medium text-rose-500">
                                {errors.cliente_id}
                            </span>
                        )}
                    </div>
                    {/* Número da apólice */}
                    <div className="space-y-2">
                        <label className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                            Número da Apólice*
                        </label>
                        <Input
                            type="text"
                            placeholder="Ex: 401391234567"
                            value={data.numero_apolice}
                            onChange={(e) =>
                                setData('numero_apolice', e.target.value)
                            }
                            className="h-12 rounded-xl border-muted-foreground/20"
                        />
                        {errors.numero_apolice && (
                            <span className="text-xs font-medium text-rose-500">
                                {errors.numero_apolice}
                            </span>
                        )}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                Seguradora*
                            </label>
                            <Select
                                value={
                                    data.seguradora_id
                                        ? String(data.seguradora_id)
                                        : ''
                                }
                                onValueChange={handleSeguradoraChange}
                            >
                                <SelectTrigger className="h-12 rounded-xl border-muted-foreground/20">
                                    <SelectValue placeholder="Selecione" />
                                </SelectTrigger>
                                <SelectContent>
                                    {seguradoras.map((seguradora: any) => (
                                        <SelectItem
                                            key={seguradora.id}
                                            value={String(seguradora.id)}
                                        >
                                            {seguradora.nome_fantasia}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {errors.seguradora_id && (
                                <span className="text-xs font-medium text-rose-500">
                                    {errors.seguradora_id}
                                </span>
                            )}
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                Ramo*
                            </label>
                            <Select
                                value={data.ramo_id ? String(data.ramo_id) : ''}
                                onValueChange={(v) => setData('ramo_id', v)}
                                disabled={!data.seguradora_id} // Desabilita se não tiver seguradora selecionada
                            >
                                <SelectTrigger className="h-12 rounded-xl border-muted-foreground/20">
                                    <SelectValue
                                        placeholder={
                                            data.seguradora_id
                                                ? 'Selecione o ramo'
                                                : 'Selecione a seguradora primeiro'
                                        }
                                    />
                                </SelectTrigger>
                                <SelectContent>
                                    {ramos
                                        .filter(
                                            (ramo: any) =>
                                                String(ramo.seguradora_id) ===
                                                String(data.seguradora_id),
                                        )
                                        .map((ramo: any) => (
                                            <SelectItem
                                                key={ramo.id}
                                                value={String(ramo.id)}
                                            >
                                                {ramo.nome_ramo}
                                            </SelectItem>
                                        ))}
                                </SelectContent>
                            </Select>
                            {errors.ramo_id && (
                                <span className="text-xs font-medium text-rose-500">
                                    {errors.ramo_id}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Vigência */}
                <div className="mt-4 space-y-4">
                    <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                        Vigência
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                Início da Vigência*
                            </label>
                            <Input
                                type="date"
                                value={data.inicio_vigencia}
                                onChange={(e) =>
                                    setData('inicio_vigencia', e.target.value)
                                }
                                className="h-12 rounded-xl border-muted-foreground/20"
                            />
                            {errors.inicio_vigencia && (
                                <span className="text-xs font-medium text-rose-500">
                                    {errors.inicio_vigencia}
                                </span>
                            )}
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                Fim da Vigência*
                            </label>
                            <Input
                                type="date"
                                value={data.fim_vigencia}
                                onChange={(e) =>
                                    setData('fim_vigencia', e.target.value)
                                }
                                className="h-12 rounded-xl border-muted-foreground/20"
                            />
                            {errors.fim_vigencia && (
                                <span className="text-xs font-medium text-rose-500">
                                    {errors.fim_vigencia}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
                {/* Valores e Pagamento */}
                <div className="mt-4 space-y-4">
                    <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                        Valores e Pagamento
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                Valor do Prêmio*
                            </label>
                            <Input
                                type="number"
                                placeholder="R$ 0,00"
                                value={data.valor_premio_total}
                                onChange={(e) =>
                                    setData(
                                        'valor_premio_total',
                                        e.target.value,
                                    )
                                }
                                className="h-12 rounded-xl border-muted-foreground/20"
                            />
                            {errors.valor_premio_total && (
                                <span className="text-xs font-medium text-rose-500">
                                    {errors.valor_premio_total}
                                </span>
                            )}
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                Valor de Cobertura*
                            </label>
                            <Input
                                type="number"
                                placeholder="R$ 0,00"
                                value={data.valor_cobertura}
                                onChange={(e) =>
                                    setData('valor_cobertura', e.target.value)
                                }
                                className="h-12 rounded-xl border-muted-foreground/20"
                            />
                            {errors.valor_cobertura && (
                                <span className="text-xs font-medium text-rose-500">
                                    {errors.valor_cobertura}
                                </span>
                            )}
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                Quantidade de Parcelas*
                            </label>
                            <Input
                                type="number"
                                placeholder="12"
                                value={data.quantidade_parcelas}
                                onChange={(e) =>
                                    setData(
                                        'quantidade_parcelas',
                                        e.target.value,
                                    )
                                }
                                className="h-12 rounded-xl border-muted-foreground/20"
                            />
                            {errors.quantidade_parcelas && (
                                <span className="text-xs font-medium text-rose-500">
                                    {errors.quantidade_parcelas}
                                </span>
                            )}
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                Forma de Pagamento*
                            </label>
                            <Select
                                value={data.forma_pagamento}
                                onValueChange={(v) =>
                                    setData('forma_pagamento', v)
                                }
                            >
                                <SelectTrigger className="h-12 rounded-xl border-muted-foreground/20">
                                    <SelectValue placeholder="Selecione" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="boleto">
                                        Boleto
                                    </SelectItem>
                                    <SelectItem value="cartao">
                                        Cartão
                                    </SelectItem>
                                    <SelectItem value="pix">Pix</SelectItem>
                                    <SelectItem value="debito">
                                        Débito Automático
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                            {errors.forma_pagamento && (
                                <span className="text-xs font-medium text-rose-500">
                                    {errors.forma_pagamento}
                                </span>
                            )}
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                            Status*
                        </label>
                        <Select
                            value={data.status}
                            onValueChange={(v) => setData('status', v)}
                        >
                            <SelectTrigger className="h-12 rounded-xl border-muted-foreground/20">
                                <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Ativa">Ativa</SelectItem>
                                <SelectItem value="Inativa">Inativa</SelectItem>
                            </SelectContent>
                        </Select>
                        {errors.status && (
                            <span className="text-xs font-medium text-rose-500">
                                {errors.status}
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
                </div>

                {/* Botões */}
                <div className="mt-4 flex justify-end gap-2">
                    <Button
                        variant="outline"
                        onClick={() => setOpen(false)}
                        className="rounded-xl"
                    >
                        Cancelar
                    </Button>
                    <Button
                        onClick={salvarApolice}
                        className="h-12 rounded-xl bg-emerald-500 font-bold text-white shadow-lg shadow-emerald-500/20 transition-all hover:bg-emerald-600 active:scale-[0.98]"
                    >
                        Cadastrar Apólice
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
