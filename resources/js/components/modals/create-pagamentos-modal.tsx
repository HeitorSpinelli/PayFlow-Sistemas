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
import {
    Barcode,
    Check,
    ChevronRight,
    CreditCard,
    FileText,
    Landmark,
    Search,
    UserRound,
} from 'lucide-react';
import { toast } from 'sonner';

function Section({ icon, title, description, children }: any) {
    return (
        <section className="rounded-2xl border border-border/70 bg-muted/[0.18] p-4 sm:p-5">
            <div className="mb-5 flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
                    {icon}
                </span>
                <div>
                    <h3 className="text-sm font-bold">{title}</h3>
                    <p className="text-xs text-muted-foreground">
                        {description}
                    </p>
                </div>
            </div>
            {children}
        </section>
    );
}

const inputClass =
    'h-10 w-full rounded-xl border border-border/70 bg-background px-3 py-2 text-sm shadow-sm transition-all placeholder:text-muted-foreground/55 hover:border-emerald-500/40 focus-visible:ring-4 focus-visible:ring-emerald-500/10 focus-visible:outline-none';

const selectTriggerClass =
    'h-10 w-full rounded-xl border border-border/70 bg-background px-3 py-2 text-sm shadow-sm transition-all hover:border-emerald-500/40 focus:ring-4 focus:ring-emerald-500/10 focus:outline-none';

// Símbolo do Pix — versão simplificada (não é o logotipo oficial do Bacen)
function PixIcon({ className }: { className?: string }) {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            className={className}
            xmlns="http://www.w3.org/2000/svg"
        >
            <path
                d="M8.5 3.5a3 3 0 0 1 4.2 0l7.8 7.8a3 3 0 0 1 0 4.2l-7.8 7.8a3 3 0 0 1-4.2 0l-7.8-7.8a3 3 0 0 1 0-4.2l7.8-7.8Z"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinejoin="round"
            />
            <path
                d="M9 8.5c.9-.9 2.1-.9 3 0M15 15.5c-.9.9-2.1.9-3 0"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
            />
        </svg>
    );
}

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

    const btnClass =
        'flex items-center gap-1.5 h-10 px-3 rounded-xl border border-border/70 bg-background text-sm font-medium text-foreground shadow-sm transition-all hover:border-emerald-500/40 hover:bg-muted/50';

    // Ícone representativo de cada forma de pagamento
    const iconesFormaPagamento: Record<string, any> = {
        Boleto: Barcode,
        Pix: PixIcon,
        Cartão: CreditCard,
        Débito: Landmark,
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="!flex max-h-[92vh] max-w-2xl flex-col gap-0 overflow-hidden rounded-2xl border-border/70 p-0 shadow-2xl">
                <DialogHeader className="relative shrink-0 overflow-hidden border-b border-border/70 bg-gradient-to-br from-emerald-500/[0.12] via-background to-background px-6 py-6 pr-12 sm:px-8">
                    <div className="absolute -top-12 -right-10 h-36 w-36 rounded-full bg-emerald-500/10 blur-2xl" />
                    <div className="relative flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-lg shadow-emerald-500/25">
                            <CreditCard className="h-5 w-5" />
                        </div>
                        <div>
                            <div className="mb-1 flex items-center gap-1.5 text-[10px] font-bold tracking-[0.16em] text-emerald-600 uppercase">
                                <span>Pagamentos</span>
                                <ChevronRight className="h-3 w-3" />
                                <span>Novo registro</span>
                            </div>
                            <DialogTitle className="text-xl font-bold tracking-tight sm:text-2xl">
                                Registrar pagamento
                            </DialogTitle>
                        </div>
                    </div>
                    <p className="relative mt-3 max-w-lg text-sm leading-relaxed text-muted-foreground">
                        Preencha os dados abaixo para registrar um novo
                        pagamento. Campos obrigatórios estão marcados com{' '}
                        <span className="font-bold text-emerald-600">*</span>.
                    </p>
                </DialogHeader>

                <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-6 py-6 sm:px-8">
                    <Section
                        icon={<UserRound className="h-4 w-4" />}
                        title="Segurado"
                        description="Cliente responsável pelo pagamento"
                    >
                        <div className="space-y-2" ref={wrapperRef}>
                            <label className="text-sm leading-none font-medium">
                                Segurado *
                            </label>
                            <div className="relative">
                                <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground/60" />
                                <Input
                                    placeholder="Digite o nome, CPF ou CNPJ do segurado"
                                    className={`${inputClass} pl-9`}
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
                                        <div className="absolute right-0 left-0 z-50 mt-1 max-h-56 overflow-hidden overflow-y-auto rounded-xl border border-border/70 bg-popover py-1.5 shadow-xl">
                                            {sugestoes.map((s: any) => (
                                                <button
                                                    key={s.id}
                                                    type="button"
                                                    onClick={() =>
                                                        selecionarSegurado(s)
                                                    }
                                                    className="flex w-full flex-col items-start px-3 py-2 text-left text-sm transition-colors hover:bg-muted"
                                                >
                                                    <span className="font-medium text-popover-foreground">
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
                                        <div className="absolute right-0 left-0 z-50 mt-1 rounded-xl border border-border/70 bg-popover px-3 py-2 text-sm text-muted-foreground shadow-xl">
                                            Nenhum segurado encontrado
                                        </div>
                                    )}
                            </div>

                            {data.segurado_id && (
                                <p className="flex items-center gap-1 text-xs font-medium text-emerald-600">
                                    <Check className="size-3.5" />
                                    Segurado selecionado
                                </p>
                            )}
                            {(errors as any).segurado_id && (
                                <span className="text-xs font-medium text-rose-500">
                                    {(errors as any).segurado_id}
                                </span>
                            )}
                        </div>
                    </Section>

                    <Section
                        icon={<CreditCard className="h-4 w-4" />}
                        title="Apólice e parcela"
                        description="Referência do pagamento"
                    >
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <label className="text-sm leading-none font-medium">
                                    Apólice *
                                </label>
                                <Select
                                    value={data.apolice_id}
                                    onValueChange={(v) =>
                                        setData('apolice_id', v)
                                    }
                                    disabled={!data.segurado_id}
                                >
                                    <SelectTrigger
                                        className={selectTriggerClass}
                                    >
                                        <SelectValue
                                            placeholder={
                                                data.segurado_id
                                                    ? 'Selecione'
                                                    : 'Escolha um segurado'
                                            }
                                        />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl border border-border/70 bg-popover text-popover-foreground shadow-md">
                                        {apolicesDoSegurado.length === 0 && (
                                            <div className="px-3 py-2 text-sm text-muted-foreground">
                                                Nenhuma apólice para esse
                                                segurado
                                            </div>
                                        )}
                                        {apolicesDoSegurado.map((a: any) => (
                                            <SelectItem
                                                key={a.id}
                                                value={String(a.id)}
                                                className="cursor-pointer rounded-lg"
                                            >
                                                {a.numero_apolice}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {(errors as any).apolice_id && (
                                    <span className="text-xs font-medium text-rose-500">
                                        {(errors as any).apolice_id}
                                    </span>
                                )}
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm leading-none font-medium">
                                    Parcela *
                                </label>
                                <Select
                                    value={data.parcela}
                                    onValueChange={(v) => setData('parcela', v)}
                                >
                                    <SelectTrigger
                                        className={selectTriggerClass}
                                    >
                                        <SelectValue placeholder="Selecione" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl border border-border/70 bg-popover text-popover-foreground shadow-md">
                                        {[
                                            1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11,
                                            12,
                                        ].map((n) => (
                                            <SelectItem
                                                key={n}
                                                value={String(n)}
                                                className="cursor-pointer rounded-lg"
                                            >
                                                {n}ª Parcela
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {(errors as any).parcela && (
                                    <span className="text-xs font-medium text-rose-500">
                                        {(errors as any).parcela}
                                    </span>
                                )}
                                {/* Preenchimento automático de Parcela e Data ainda será definido com o cliente */}
                            </div>
                        </div>
                    </Section>

                    <Section
                        icon={<CreditCard className="h-4 w-4" />}
                        title="Valores e pagamento"
                        description="Valor pago e forma utilizada"
                    >
                        <div className="space-y-4">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <label className="text-sm leading-none font-medium">
                                        Valor (R$) *
                                    </label>
                                    <Input
                                        type="number"
                                        placeholder="0,00"
                                        className={inputClass}
                                        value={data.valor}
                                        onChange={(e) =>
                                            setData('valor', e.target.value)
                                        }
                                    />
                                    {(errors as any).valor && (
                                        <span className="text-xs font-medium text-rose-500">
                                            {(errors as any).valor}
                                        </span>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm leading-none font-medium">
                                        Data do pagamento *
                                    </label>
                                    <Input
                                        type="date"
                                        className={inputClass}
                                        value={data.data_pagamento}
                                        onChange={(e) =>
                                            setData(
                                                'data_pagamento',
                                                e.target.value,
                                            )
                                        }
                                    />
                                    {(errors as any).data_pagamento && (
                                        <span className="text-xs font-medium text-rose-500">
                                            {(errors as any).data_pagamento}
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm leading-none font-medium">
                                    Forma de pagamento *
                                </label>
                                <div className="flex flex-wrap gap-2">
                                    {['Boleto', 'Pix', 'Cartão', 'Débito'].map(
                                        (forma) => {
                                            const Icone =
                                                iconesFormaPagamento[forma];
                                            const ativo =
                                                data.forma_pagamento ===
                                                forma.toLowerCase();
                                            return (
                                                <button
                                                    key={forma}
                                                    type="button"
                                                    onClick={() =>
                                                        setData(
                                                            'forma_pagamento',
                                                            forma.toLowerCase(),
                                                        )
                                                    }
                                                    className={btnClass}
                                                >
                                                    <Icone className="size-4" />
                                                    {forma}
                                                    {ativo && (
                                                        <Check className="size-3.5" />
                                                    )}
                                                </button>
                                            );
                                        },
                                    )}
                                </div>
                                {(errors as any).forma_pagamento && (
                                    <span className="text-xs font-medium text-rose-500">
                                        {(errors as any).forma_pagamento}
                                    </span>
                                )}
                            </div>
                        </div>
                    </Section>

                    <Section
                        icon={<FileText className="h-4 w-4" />}
                        title="Observações"
                        description="Anotações adicionais sobre o pagamento"
                    >
                        <textarea
                            rows={3}
                            placeholder="Informações adicionais..."
                            value={data.observacoes}
                            onChange={(e) =>
                                setData('observacoes', e.target.value)
                            }
                            className={`${inputClass} h-auto resize-none`}
                        />
                    </Section>
                </div>

                <div className="flex shrink-0 items-center justify-end gap-2 border-t border-border/70 bg-background px-6 py-4 sm:px-8">
                    <Button
                        variant="outline"
                        className="rounded-xl"
                        onClick={() => setOpen(false)}
                    >
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        className="rounded-xl bg-emerald-500 text-white shadow-lg shadow-emerald-500/25 hover:bg-emerald-600"
                    >
                        <Check className="mr-2 size-4" />
                        Registrar pagamento
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
