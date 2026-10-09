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
} from 'lucide-react';
import { toast } from 'sonner';

import {
    removeMask,
    formataCpfCnpj,
    formatarMoeda,
    valorDigitadoParaNumero,
} from '@/utils/Masks';

// Bloco numerado do formulário. O preenchimento segue uma ordem real
// (segurado → apólice → valor → observações), então a numeração informa
// o caminho; o check indica que a etapa já está resolvida.
function Section({
    step,
    icon,
    done,
    title,
    description,
    className = '',
    children,
}: any) {
    return (
        <section
            className={`flex flex-col rounded-2xl border border-border/70 bg-background p-5 shadow-sm ${className}`}
        >
            <div className="mb-5 flex items-center gap-3">
                <span
                    className={`flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors ${
                        done
                            ? 'bg-emerald-500 text-white'
                            : 'bg-muted text-muted-foreground'
                    }`}
                    aria-hidden="true"
                >
                    {done ? <Check className="size-3.5" /> : (step ?? icon)}
                </span>
                <div className="min-w-0">
                    <h3 className="text-sm leading-tight font-semibold tracking-tight">
                        {title}
                    </h3>
                    <p className="mt-0.5 text-xs leading-tight text-muted-foreground">
                        {description}
                    </p>
                </div>
            </div>
            {children}
        </section>
    );
}

function FieldError({ message }: { message?: string }) {
    if (!message) return null;

    return (
        <p role="alert" className="text-xs font-medium text-rose-500">
            {message}
        </p>
    );
}

const labelClass = 'text-sm leading-none font-medium';

const inputClass =
    'h-10 w-full rounded-xl border border-border/70 bg-background px-3 py-2 text-sm shadow-xs transition-[border-color,box-shadow] placeholder:text-muted-foreground/55 hover:border-emerald-500/40 focus-visible:border-emerald-500/60 focus-visible:ring-4 focus-visible:ring-emerald-500/15 focus-visible:outline-none';

const selectTriggerClass =
    'h-10 w-full rounded-xl border border-border/70 bg-background px-3 py-2 text-sm shadow-xs transition-[border-color,box-shadow] hover:border-emerald-500/40 focus:border-emerald-500/60 focus:ring-4 focus:ring-emerald-500/15 focus:outline-none disabled:cursor-not-allowed disabled:bg-muted/40';

// Iniciais para o avatar da lista de sugestões (primeiro e último nome)
function iniciais(nome?: string) {
    const partes = (nome ?? '').trim().split(/\s+/).filter(Boolean);
    if (partes.length === 0) return '?';
    if (partes.length === 1) return partes[0][0].toUpperCase();

    return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
}

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
    const { data, setData, post, reset, clearErrors, errors, processing } =
        useForm({
            segurado_id: '',
            apolice_id: '',
            parcela: '',
            valor: '',
            // Quando false (padrão), o backend calcula o valor final sozinho
            // (parcela + multa/juros pela data de pagamento informada) e ignora
            // o que estiver no campo. Só quando o operador marca "ajustar valor
            // manualmente" é que o valor digitado prevalece — antes o backend
            // tentava adivinhar isso pela diferença numérica, e errava sempre
            // que a data de pagamento era retroativa.
            valor_manual: false as boolean,
            data_pagamento: '',
            forma_pagamento: '',
            status: 'confirmado', // pagamento já nasce confirmado ao ser registrado
            observacoes: '',
        });

    // Texto digitado no campo de busca de segurado
    const [buscaSegurado, setBuscaSegurado] = useState('');
    // Controla se a lista de sugestões está visível
    const [sugestoesAbertas, setSugestoesAbertas] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    // Sempre que o modal fechar (por X, Cancelar, clique fora, Esc, etc.), limpa tudo
    // Serve como garantia extra — o caminho de sucesso já limpa explicitamente no handleSubmit
    useEffect(() => {
        if (!open) {
            reset();
            clearErrors();
            setBuscaSegurado('');
            setSugestoesAbertas(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    // Filtra segurados pelo nome OU cpf_cnpj conforme o texto digitado (por prefixo)
    const sugestoes = (() => {
        if (!buscaSegurado.trim()) return [];
        const termo = buscaSegurado.toLowerCase();
        const numerosTermo = removeMask(buscaSegurado);

        return (segurados ?? [])
            .filter((s: any) => {
                // includes e não startsWith: "Silva" precisa achar "Maria
                // Silva". Com o prefixo, a tela dizia "Nenhum segurado
                // encontrado. Cadastre o cliente..." para cliente que já
                // existe — convidando o operador a criar uma duplicata. É
                // também o mesmo comportamento do filtro da lista, que no
                // backend usa ilike '%termo%'.
                const nomeBate = s.nome_completo?.toLowerCase().includes(termo);
                // só compara por número se o usuário realmente digitou algum número
                const cpfBate =
                    numerosTermo.length > 0 &&
                    removeMask(s.cpf_cnpj ?? '').startsWith(numerosTermo);
                return nomeBate || cpfBate;
            })
            .slice(0, 8); // limita a 8 sugestões pra não estourar a tela
    })();

    const selecionarSegurado = (segurado: any) => {
        setData('segurado_id', String(segurado.id));
        // limpa apólice/parcela já escolhidas, já que pertenciam ao segurado anterior
        setData('apolice_id', '');
        setData('parcela', '');
        setData('valor', '');
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

    // Apólice atualmente selecionada (usada para parcelas, valor e bloqueio)
    const apoliceSelecionada = apolicesDoSegurado.find(
        (a: any) => String(a.id) === data.apolice_id,
    );

    // Quantidade de parcelas da apólice atualmente selecionada (fallback 12)
    const totalParcelasApolice = apoliceSelecionada?.quantidade_parcelas ?? 12;

    // Parcelas já registradas para a apólice atualmente selecionada
    const parcelasJaRegistradas = (apoliceSelecionada?.pagamentos ?? []).map(
        (p: any) => Number(p.parcela),
    );

    // Ao escolher a apólice, calcula automaticamente a próxima parcela em aberto e o valor dela
    useEffect(() => {
        if (!data.apolice_id) return;

        const apolice = apolicesDoSegurado.find(
            (a: any) => String(a.id) === data.apolice_id,
        );
        if (!apolice) return;

        const totalParcelas = apolice.quantidade_parcelas ?? 1;

        // Parcelas que já têm pagamento lançado para essa apólice
        const parcelasPagas = (apolice.pagamentos ?? []).map((p: any) =>
            Number(p.parcela),
        );

        // Primeira parcela (de 1 até o total) que ainda não foi lançada
        let proximaParcela = 1;
        for (let n = 1; n <= totalParcelas; n++) {
            if (!parcelasPagas.includes(n)) {
                proximaParcela = n;
                break;
            }
        }

        setData((prev) => ({
            ...prev,
            parcela: String(proximaParcela),
        }));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [data.apolice_id]);

    // Mantém o valor exibido acompanhando a parcela selecionada — inclusive
    // quando o operador troca a parcela na mão, o que antes deixava o valor
    // da parcela anterior no campo. Não mexe no campo quando ele está em
    // modo manual, pra não sobrescrever o que o operador digitou.
    useEffect(() => {
        if (!data.apolice_id || !data.parcela || data.valor_manual) return;

        const apolice = apolicesDoSegurado.find(
            (a: any) => String(a.id) === data.apolice_id,
        );
        if (!apolice) return;

        // valor_sugerido vem do backend já com multa/juros (se atrasada). É só
        // uma prévia calculada na data de hoje: o valor gravado é sempre
        // recalculado no PagamentoService com a data de pagamento informada.
        const parcelaReal = (apolice.parcelas ?? []).find(
            (p: any) => Number(p.numero_parcela) === Number(data.parcela),
        );

        // Fallback pra apólice antiga sem parcelas materializadas: divide o
        // prêmio pelo número de parcelas, que é como o valor era estimado antes.
        const totalParcelas = apolice.quantidade_parcelas ?? 1;
        const valorParcela = parcelaReal
            ? Number(parcelaReal.valor_sugerido ?? parcelaReal.valor_parcela)
            : Number(apolice.valor_premio_total ?? 0) / totalParcelas;

        setData('valor', valorParcela.toFixed(2));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [data.apolice_id, data.parcela, data.valor_manual]);

    const handleSubmit = () => {
        // Antes de enviar, garante que as etapas anteriores (cadastro do
        // cliente e da apólice) não foram puladas — sem isso o backend só
        // rejeita "apolice_id" como obrigatório, sem explicar o motivo real.
        if (!data.segurado_id) {
            toast.error(
                'Selecione um segurado cadastrado antes de registrar o pagamento. Se o cliente ainda não existe, cadastre-o primeiro.',
            );

            return;
        }

        if (!data.apolice_id) {
            toast.error(
                'Esse segurado ainda não possui nenhuma apólice cadastrada. Cadastre uma apólice para ele antes de registrar o pagamento.',
            );

            return;
        }

        // Mesmas regras que o backend exige (StorePagamentoRequest) —
        // checar aqui evita a ida e volta ao servidor só pra descobrir um
        // campo obrigatório vazio.
        if (!data.valor || Number(data.valor) <= 0) {
            toast.error('Informe o valor do pagamento.');

            return;
        }

        if (!data.data_pagamento) {
            toast.error('Informe a data do pagamento.');

            return;
        }

        if (!data.forma_pagamento) {
            toast.error('Selecione a forma de pagamento.');

            return;
        }

        post('/pagamentos', {
            // Sem toast.success aqui: o Inertia trata uma resposta com flash
            // de ERRO como visita bem-sucedida (é um redirect 302, não um
            // erro HTTP), então este callback rodava mesmo quando o backend
            // rejeitava — mostrando um toast verde junto com o vermelho do
            // layout, fechando o modal e apagando o que o operador digitou.
            // O AppSidebarLayout já exibe sucesso e erro a partir do flash.
            // Mesmo motivo pelo qual create-profile-modal.tsx removeu o dele.
            onSuccess: () => {
                reset();
                clearErrors();
                setBuscaSegurado('');
                setSugestoesAbertas(false);
                setOpen(false);
            },
            onError: () => {
                toast.error(
                    'Falha ao registrar. Verifique os campos destacados.',
                );
            },
        });
    };

    // Ícone representativo de cada forma de pagamento
    const iconesFormaPagamento: Record<string, any> = {
        Boleto: Barcode,
        Pix: PixIcon,
        Cartão: CreditCard,
        Débito: Landmark,
    };

    return (
        <Dialog
            open={open}
            onOpenChange={(isOpen) => {
                setOpen(isOpen);
            }}
        >
            <DialogContent className="!flex max-h-[92vh] flex-col gap-0 overflow-hidden rounded-2xl border-border/70 p-0 shadow-2xl sm:max-w-4xl">
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

                <div className="min-h-0 flex-1 overflow-y-auto bg-muted/30 px-6 py-6 sm:px-8">
                    <div className="grid gap-5 md:grid-cols-2">
                        <Section
                            className="md:col-start-1"
                            step={1}
                            done={!!data.segurado_id}
                            title="Segurado"
                            description="Cliente responsável pelo pagamento"
                        >
                            <div className="space-y-2" ref={wrapperRef}>
                                <label className={labelClass}>Segurado *</label>
                                <div className="relative">
                                    <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground/60" />
                                    <Input
                                        placeholder="Nome, CPF ou CNPJ do segurado"
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
                                                setData('valor', '');
                                            }
                                        }}
                                        onFocus={() =>
                                            setSugestoesAbertas(
                                                buscaSegurado.trim().length > 0,
                                            )
                                        }
                                    />

                                    {/* Lista de sugestões — só aparece com texto digitado e sem segurado já escolhido */}
                                    {sugestoesAbertas &&
                                        sugestoes.length > 0 &&
                                        !data.segurado_id && (
                                            <div className="absolute right-0 left-0 z-50 mt-1.5 max-h-60 overflow-hidden overflow-y-auto rounded-xl border border-border/70 bg-popover p-1 shadow-xl">
                                                {sugestoes.map((s: any) => (
                                                    <button
                                                        key={s.id}
                                                        type="button"
                                                        onClick={() =>
                                                            selecionarSegurado(
                                                                s,
                                                            )
                                                        }
                                                        className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left text-sm transition-colors hover:bg-muted focus-visible:bg-muted focus-visible:outline-none"
                                                    >
                                                        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                                                            {iniciais(
                                                                s.nome_completo,
                                                            )}
                                                        </span>
                                                        <span className="flex min-w-0 flex-col">
                                                            <span className="truncate font-medium text-popover-foreground">
                                                                {
                                                                    s.nome_completo
                                                                }
                                                            </span>
                                                            <span className="text-xs text-muted-foreground tabular-nums">
                                                                {formataCpfCnpj(
                                                                    s.cpf_cnpj ??
                                                                        '',
                                                                )}
                                                            </span>
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
                                            <div className="absolute right-0 left-0 z-50 mt-1.5 rounded-xl border border-border/70 bg-popover px-3.5 py-3 text-sm leading-relaxed text-muted-foreground shadow-xl">
                                                Nenhum segurado encontrado.
                                                Cadastre o cliente antes de
                                                registrar o pagamento.
                                            </div>
                                        )}
                                </div>

                                {data.segurado_id && (
                                    <p className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                                        <Check className="size-3.5" />
                                        Segurado selecionado
                                    </p>
                                )}
                                <FieldError
                                    message={(errors as any).segurado_id}
                                />
                            </div>
                        </Section>
                        <Section
                            className="md:col-start-1"
                            step={2}
                            done={!!data.apolice_id && !!data.parcela}
                            title="Apólice e parcela"
                            description="Referência do pagamento"
                        >
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <label className={labelClass}>
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
                                            {apolicesDoSegurado.length ===
                                                0 && (
                                                <div className="px-3 py-2 text-sm text-muted-foreground">
                                                    Nenhuma apólice para esse
                                                    segurado. Cadastre uma
                                                    apólice antes de registrar o
                                                    pagamento.
                                                </div>
                                            )}
                                            {apolicesDoSegurado.map(
                                                (a: any) => (
                                                    <SelectItem
                                                        key={a.id}
                                                        value={String(a.id)}
                                                        className="cursor-pointer rounded-lg"
                                                    >
                                                        {a.numero_apolice}
                                                    </SelectItem>
                                                ),
                                            )}
                                        </SelectContent>
                                    </Select>
                                    <FieldError
                                        message={(errors as any).apolice_id}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className={labelClass}>
                                        Parcela *
                                    </label>
                                    <Select
                                        value={data.parcela}
                                        onValueChange={(v) =>
                                            setData('parcela', v)
                                        }
                                        disabled={!data.apolice_id}
                                    >
                                        <SelectTrigger
                                            className={selectTriggerClass}
                                        >
                                            <SelectValue placeholder="Selecione" />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-xl border border-border/70 bg-popover text-popover-foreground shadow-md">
                                            {Array.from(
                                                {
                                                    length: totalParcelasApolice,
                                                },
                                                (_, i) => i + 1,
                                            ).map((n) => {
                                                const jaRegistrada =
                                                    parcelasJaRegistradas.includes(
                                                        n,
                                                    );
                                                return (
                                                    <SelectItem
                                                        key={n}
                                                        value={String(n)}
                                                        disabled={jaRegistrada}
                                                        className="cursor-pointer rounded-lg data-[disabled]:cursor-not-allowed data-[disabled]:opacity-40"
                                                    >
                                                        {n}ª Parcela
                                                        {jaRegistrada &&
                                                            ' — já paga'}
                                                    </SelectItem>
                                                );
                                            })}
                                        </SelectContent>
                                    </Select>
                                    <FieldError
                                        message={(errors as any).parcela}
                                    />
                                </div>
                            </div>
                            {data.apolice_id && (
                                <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
                                    Parcela e valor preenchidos automaticamente
                                    — ajuste se necessário.
                                </p>
                            )}
                        </Section>

                        <Section
                            className="md:col-start-2 md:row-span-2 md:row-start-1"
                            step={3}
                            done={
                                !!data.valor &&
                                Number(data.valor) > 0 &&
                                !!data.data_pagamento &&
                                !!data.forma_pagamento
                            }
                            title="Valores e pagamento"
                            description="Valor pago e forma utilizada"
                        >
                            <div className="space-y-5">
                                {/* Valor e data na mesma linha, com altura idêntica pra alinhar */}
                                <div className="grid items-start gap-4 sm:grid-cols-2">
                                    <div className="space-y-2">
                                        <label className={labelClass}>
                                            Valor (R$) *
                                        </label>
                                        <div className="relative">
                                            <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm font-medium text-muted-foreground">
                                                R$
                                            </span>
                                            <Input
                                                type="text"
                                                inputMode="numeric"
                                                placeholder="0,00"
                                                className={`${inputClass} pl-9 font-semibold tabular-nums ${
                                                    !data.valor_manual
                                                        ? 'cursor-not-allowed border-dashed bg-muted/50 text-muted-foreground'
                                                        : ''
                                                }`}
                                                readOnly={!data.valor_manual}
                                                value={
                                                    data.valor &&
                                                    Number(data.valor) > 0
                                                        ? formatarMoeda(
                                                              Number(
                                                                  data.valor,
                                                              ),
                                                          )
                                                        : ''
                                                }
                                                onChange={(e) =>
                                                    setData(
                                                        'valor',
                                                        valorDigitadoParaNumero(
                                                            e.target.value,
                                                        ).toFixed(2),
                                                    )
                                                }
                                            />
                                        </div>
                                        <FieldError
                                            message={(errors as any).valor}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className={labelClass}>
                                            Data do pagamento *
                                        </label>
                                        <Input
                                            type="date"
                                            max={
                                                new Date()
                                                    .toISOString()
                                                    .split('T')[0]
                                            }
                                            className={inputClass}
                                            value={data.data_pagamento}
                                            onChange={(e) =>
                                                setData(
                                                    'data_pagamento',
                                                    e.target.value,
                                                )
                                            }
                                        />
                                        <FieldError
                                            message={
                                                (errors as any).data_pagamento
                                            }
                                        />
                                    </div>
                                </div>

                                {/* Opção de ajuste manual + explicação, em largura total */}
                                <div className="space-y-2">
                                    <label className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-border/70 bg-muted/30 px-3 py-2.5 text-sm transition-colors hover:border-emerald-500/40 has-[:checked]:border-emerald-500/50 has-[:checked]:bg-emerald-500/10">
                                        <input
                                            type="checkbox"
                                            checked={data.valor_manual}
                                            onChange={(e) =>
                                                setData(
                                                    'valor_manual',
                                                    e.target.checked,
                                                )
                                            }
                                            className="size-4 shrink-0 accent-emerald-500"
                                        />
                                        <span className="font-medium">
                                            Ajustar valor manualmente
                                        </span>
                                        <span className="text-xs text-muted-foreground">
                                            (desconto negociado)
                                        </span>
                                    </label>
                                    {!data.valor_manual && (
                                        <p className="text-xs leading-relaxed text-muted-foreground">
                                            Prévia calculada para hoje, com
                                            multa e juros se houver atraso. O
                                            valor gravado é recalculado na data
                                            de pagamento informada.
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <label className={labelClass}>
                                        Forma de pagamento *
                                    </label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {[
                                            'Boleto',
                                            'Pix',
                                            'Cartão',
                                            'Débito',
                                        ].map((forma) => {
                                            const Icone =
                                                iconesFormaPagamento[forma];
                                            const ativo =
                                                data.forma_pagamento ===
                                                forma.toLowerCase();
                                            return (
                                                <button
                                                    key={forma}
                                                    type="button"
                                                    aria-pressed={ativo}
                                                    onClick={() =>
                                                        setData(
                                                            'forma_pagamento',
                                                            forma.toLowerCase(),
                                                        )
                                                    }
                                                    className={`flex h-11 items-center gap-2.5 rounded-xl border px-3 text-sm font-medium transition-colors focus-visible:ring-4 focus-visible:ring-emerald-500/15 focus-visible:outline-none ${
                                                        ativo
                                                            ? 'border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                                                            : 'border-border/70 bg-background text-foreground hover:border-emerald-500/40 hover:bg-muted/50'
                                                    }`}
                                                >
                                                    <Icone className="size-5 shrink-0" />
                                                    {forma}
                                                    {ativo && (
                                                        <Check className="ml-auto size-4" />
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                    <FieldError
                                        message={
                                            (errors as any).forma_pagamento
                                        }
                                    />
                                </div>
                            </div>
                        </Section>

                        <Section
                            className="md:col-span-2"
                            icon={<FileText className="size-3.5" />}
                            done={!!data.observacoes.trim()}
                            title="Observações"
                            description="Anotações adicionais (opcional)"
                        >
                            <textarea
                                rows={5}
                                placeholder="Informações adicionais..."
                                value={data.observacoes}
                                onChange={(e) =>
                                    setData('observacoes', e.target.value)
                                }
                                className={`${inputClass} min-h-36 flex-1 resize-none leading-relaxed`}
                            />
                        </Section>
                    </div>
                </div>

                <div className="flex shrink-0 items-center justify-end gap-2 border-t border-border/70 bg-background px-6 py-4 sm:px-8">
                    <Button
                        variant="outline"
                        className="h-10 rounded-xl px-5"
                        onClick={() => setOpen(false)}
                    >
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={processing}
                        className="h-10 rounded-xl bg-emerald-500 px-5 text-white shadow-sm hover:bg-emerald-600 disabled:opacity-60"
                    >
                        <Check className="mr-2 size-4" />
                        {processing ? 'Registrando…' : 'Registrar pagamento'}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}