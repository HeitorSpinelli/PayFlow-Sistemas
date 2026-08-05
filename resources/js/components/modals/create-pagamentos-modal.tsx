import { useState, useRef, useEffect } from 'react';
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
import { useForm } from '@inertiajs/react';
import { Search, Check } from 'lucide-react';
import { toast } from 'sonner';

export default function CreatePagamentoModal({
    open,
    setOpen,
    segurados,
    apolices,
}: any) {
    const { data, setData, post, reset, errors } = useForm({
        segurado_id: '',
        apolice_id: '',
        parcela: '',
        valor: '',
        data_pagamento: '',
        forma_pagamento: '',
        status: '',
        observacoes: '',
    });

    // Texto digitado no campo de busca de segurado
    const [buscaSegurado, setBuscaSegurado] = useState('');
    // Controla se a lista de sugestões está visível
    const [sugestoesAbertas, setSugestoesAbertas] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    // Remove tudo que não for número (usado para comparar CPF/CNPJ)
    const apenasNumeros = (str: string) => str.replace(/\D/g, '');

    // Filtra segurados pelo nome OU cpf_cnpj conforme o texto digitado
    const sugestoes = (() => {
        if (!buscaSegurado.trim()) return [];
        const termo = buscaSegurado.toLowerCase();
        const numerosTermo = apenasNumeros(buscaSegurado);

        return (segurados ?? [])
            .filter((s: any) => {
                const nomeBate = s.nome_completo?.toLowerCase().includes(termo);
                // só compara por número se o usuário realmente digitou algum número
                const cpfBate =
                    numerosTermo.length > 0 &&
                    apenasNumeros(s.cpf_cnpj ?? '').includes(numerosTermo);
                return nomeBate || cpfBate;
            })
            .slice(0, 8); // limita a 8 sugestões pra não estourar a tela
    })();

    const selecionarSegurado = (segurado: any) => {
        setData('segurado_id', String(segurado.id));
        // limpa apólice/parcela já escolhidas, já que pertenciam ao segurado anterior
        setData('apolice_id', '');
        setData('parcela', '');
        setBuscaSegurado(segurado.nome_completo);
        setSugestoesAbertas(false);
    };

    // Fecha a lista de sugestões ao clicar fora do campo
    useEffect(() => {
        const handleClickFora = (e: MouseEvent) => {
            if (
                wrapperRef.current &&
                !wrapperRef.current.contains(e.target as Node)
            ) {
                setSugestoesAbertas(false);
            }
        };
        document.addEventListener('mousedown', handleClickFora);
        return () => document.removeEventListener('mousedown', handleClickFora);
    }, []);

    // Apólices pertencentes só ao segurado selecionado
    const apolicesDoSegurado = (apolices ?? []).filter(
        (a: any) => String(a.cliente_id) === data.segurado_id,
    );

    const handleSubmit = () => {
        post('/pagamentos', {
            onSuccess: () => {
                reset();
                toast.success('Pagamento registrado com sucesso!');
                setBuscaSegurado('');
                setOpen(false);
            },
        });
    };

    const btnBase =
        'flex items-center gap-1.5 h-9 px-3 rounded-md border text-sm font-medium transition-colors';
    const btnAtivo = `${btnBase} border-[#2D5A43] bg-[#2D5A43]/10 text-[#2D5A43]`;
    const btnInativo = `${btnBase} border-sidebar-border bg-background text-foreground hover:bg-muted`;

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>Registrar Pagamento</DialogTitle>
                    <p className="text-sm text-muted-foreground">
                        Preencha os dados do pagamento para registrá-lo no
                        sistema
                    </p>
                </DialogHeader>

                <div className="flex flex-col gap-4 py-2">
                    {/* Autocomplete de Segurado por nome ou CPF/CNPJ */}
                    <div className="flex flex-col gap-1" ref={wrapperRef}>
                        <p className="text-sm font-medium">Segurado *</p>
                        <div className="relative">
                            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder="Digite o nome, CPF ou CNPJ do segurado"
                                className="pl-9"
                                value={buscaSegurado}
                                onChange={(e) => {
                                    setBuscaSegurado(e.target.value);
                                    setSugestoesAbertas(true);
                                    // se o usuário editar o texto, invalida a seleção anterior
                                    if (data.segurado_id) {
                                        setData('segurado_id', '');
                                        setData('apolice_id', '');
                                        setData('parcela', '');
                                    }
                                }}
                                onFocus={() => setSugestoesAbertas(true)}
                            />

                            {/* Lista de sugestões — só aparece com texto digitado e sem segurado já escolhido */}
                            {sugestoesAbertas &&
                                sugestoes.length > 0 &&
                                !data.segurado_id && (
                                    <div className="absolute right-0 left-0 z-50 mt-1 max-h-56 overflow-hidden overflow-y-auto rounded-md border border-sidebar-border bg-background py-1 shadow-lg">
                                        {sugestoes.map((s: any) => (
                                            <button
                                                key={s.id}
                                                type="button"
                                                onClick={() =>
                                                    selecionarSegurado(s)
                                                }
                                                className="flex w-full flex-col items-start px-3 py-2 text-left text-sm transition-colors hover:bg-muted"
                                            >
                                                <span className="font-medium text-foreground">
                                                    {s.nome_completo}
                                                </span>
                                                <span className="text-xs text-muted-foreground">
                                                    {s.cpf_cnpj}
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                )}

                            {/* Mensagem quando não encontra nada */}
                            {sugestoesAbertas &&
                                buscaSegurado.trim() &&
                                sugestoes.length === 0 &&
                                !data.segurado_id && (
                                    <div className="absolute right-0 left-0 z-50 mt-1 rounded-md border border-sidebar-border bg-background px-3 py-2 text-sm text-muted-foreground shadow-lg">
                                        Nenhum segurado encontrado
                                    </div>
                                )}
                        </div>

                        {data.segurado_id && (
                            <p className="text-sm text-green-600">
                                ✓ Segurado selecionado
                            </p>
                        )}
                        {(errors as any).segurado_id && (
                            <p className="text-sm text-red-500">
                                {(errors as any).segurado_id}
                            </p>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="flex flex-col gap-1">
                            <p className="text-sm font-medium">Apólice *</p>
                            <Select
                                value={data.apolice_id}
                                onValueChange={(v) => setData('apolice_id', v)}
                                disabled={!data.segurado_id}
                            >
                                <SelectTrigger>
                                    <SelectValue
                                        placeholder={
                                            data.segurado_id
                                                ? 'Selecione'
                                                : 'Escolha um segurado'
                                        }
                                    />
                                </SelectTrigger>
                                <SelectContent>
                                    {apolicesDoSegurado.length === 0 && (
                                        <div className="px-3 py-2 text-sm text-muted-foreground">
                                            Nenhuma apólice para esse segurado
                                        </div>
                                    )}
                                    {apolicesDoSegurado.map((a: any) => (
                                        <SelectItem
                                            key={a.id}
                                            value={String(a.id)}
                                        >
                                            {a.numero_apolice}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {(errors as any).apolice_id && (
                                <p className="text-sm text-red-500">
                                    {(errors as any).apolice_id}
                                </p>
                            )}
                        </div>
                        <div className="flex flex-col gap-1">
                            <p className="text-sm font-medium">Parcela *</p>
                            <Select
                                value={data.parcela}
                                onValueChange={(v) => setData('parcela', v)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione" />
                                </SelectTrigger>
                                <SelectContent>
                                    {[
                                        1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12,
                                    ].map((n) => (
                                        <SelectItem key={n} value={String(n)}>
                                            {n}ª Parcela
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {(errors as any).parcela && (
                                <p className="text-sm text-red-500">
                                    {(errors as any).parcela}
                                </p>
                            )}
                            {/* Preenchimento automático de Parcela e Data ainda será definido com o cliente */}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="flex flex-col gap-1">
                            <p className="text-sm font-medium">Valor (R$) *</p>
                            <Input
                                type="number"
                                placeholder="0,00"
                                value={data.valor}
                                onChange={(e) =>
                                    setData('valor', e.target.value)
                                }
                            />
                            {(errors as any).valor && (
                                <p className="text-sm text-red-500">
                                    {(errors as any).valor}
                                </p>
                            )}
                        </div>
                        <div className="flex flex-col gap-1">
                            <p className="text-sm font-medium">
                                Data do Pagamento *
                            </p>
                            <Input
                                type="date"
                                value={data.data_pagamento}
                                onChange={(e) =>
                                    setData('data_pagamento', e.target.value)
                                }
                            />
                            {(errors as any).data_pagamento && (
                                <p className="text-sm text-red-500">
                                    {(errors as any).data_pagamento}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="flex flex-col gap-1">
                        <p className="text-sm font-medium">
                            Forma de Pagamento *
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {['Boleto', 'Pix', 'Cartão', 'Débito'].map(
                                (forma) => (
                                    <button
                                        key={forma}
                                        type="button"
                                        onClick={() =>
                                            setData(
                                                'forma_pagamento',
                                                forma.toLowerCase(),
                                            )
                                        }
                                        className={
                                            data.forma_pagamento ===
                                            forma.toLowerCase()
                                                ? btnAtivo
                                                : btnInativo
                                        }
                                    >
                                        {data.forma_pagamento ===
                                            forma.toLowerCase() && (
                                            <Check className="size-3.5" />
                                        )}
                                        {forma}
                                    </button>
                                ),
                            )}
                        </div>
                        {(errors as any).forma_pagamento && (
                            <p className="text-sm text-red-500">
                                {(errors as any).forma_pagamento}
                            </p>
                        )}
                    </div>

                    <div className="flex flex-col gap-1">
                        <p className="text-sm font-medium">Observações</p>
                        <textarea
                            rows={2}
                            placeholder="Informações adicionais..."
                            value={data.observacoes}
                            onChange={(e) =>
                                setData('observacoes', e.target.value)
                            }
                            className="w-full resize-none rounded-md border border-sidebar-border bg-background px-3 py-2 text-sm focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
                        />
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                        <Button
                            variant="outline"
                            onClick={() => setOpen(false)}
                        >
                            Cancelar
                        </Button>
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
