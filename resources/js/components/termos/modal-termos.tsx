import { Link, router, usePage } from '@inertiajs/react';
import { Check, Loader2, LogOut, ShieldCheck } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogTitle,
} from '@/components/ui/dialog';
import { logout } from '@/routes';
import { documentosLegais, formatarData } from './conteudo';
import type { DocumentoLegal } from './conteudo';
import Documento from './documento';

// Prop compartilhada por HandleInertiaRequests (null quando deslogado).
export interface TermosCompartilhados {
    versao: string;
    vigenteDesde: string;
    responsavel: string;
    contato: string | null;
    pendente: boolean;
    atualizacao: boolean;
    aceitoEm: string | null;
    versaoAceita: string | null;
}

/**
 * Janela de aceite dos Termos de Uso, Política de Privacidade e Termo de
 * Confidencialidade. Aparece sozinha (montada no AppSidebarLayout) sempre
 * que o usuário logado ainda não aceitou a versão atual — no primeiro acesso
 * ou depois de uma atualização dos termos.
 *
 * Não fecha sem aceitar: cada documento precisa ser rolado até o fim, depois
 * marcar a caixa e "Aceitar e continuar" (POST /termos/aceitar). A saída é
 * "Sair" (logout). O servidor também bloqueia ações enquanto isso
 * (ExigirAceiteDosTermos).
 */
export default function ModalTermos() {
    const { props } = usePage<{
        termos?: TermosCompartilhados | null;
        auth?: { user?: { name?: string } | null };
    }>();
    const termos = props.termos;

    const documentos = useMemo(
        () =>
            termos
                ? documentosLegais({
                      responsavel: termos.responsavel,
                      contato: termos.contato,
                      versao: termos.versao,
                      vigenteDesde: termos.vigenteDesde,
                  })
                : [],
        [termos],
    );

    const [atual, setAtual] = useState<DocumentoLegal['id']>('termos');
    const [lidos, setLidos] = useState<Set<string>>(new Set());
    const [concordo, setConcordo] = useState(false);
    const [enviando, setEnviando] = useState(false);
    const [erro, setErro] = useState<string | null>(null);
    const rolagem = useRef<HTMLDivElement>(null);

    const aberto = !!termos?.pendente;
    const documento = documentos.find((d) => d.id === atual);
    const todosLidos = documentos.every((d) => lidos.has(d.id));
    const primeiroNome = props.auth?.user?.name?.split(' ')[0] ?? '';

    // Marca o documento como lido quando a rolagem chega ao fim (ou se ele
    // couber inteiro na tela, sem rolagem).
    const conferirLeitura = () => {
        const el = rolagem.current;

        if (!el || lidos.has(atual)) {
            return;
        }

        if (el.scrollTop + el.clientHeight >= el.scrollHeight - 24) {
            setLidos((anterior) => new Set(anterior).add(atual));
        }
    };

    // Ao trocar de documento: volta ao topo e confere se ele cabe sem rolar.
    useEffect(() => {
        rolagem.current?.scrollTo({ top: 0 });
        const id = window.setTimeout(conferirLeitura, 50);

        return () => window.clearTimeout(id);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [atual, aberto]);

    if (!termos || !documento) {
        return null;
    }

    const proximoNaoLido = documentos.find(
        (d) => !lidos.has(d.id) && d.id !== atual,
    );

    const aceitar = () => {
        setEnviando(true);
        setErro(null);
        router.post(
            '/termos/aceitar',
            { aceite: true },
            {
                preserveScroll: true,
                preserveState: true,
                onError: (erros) =>
                    setErro(
                        erros.aceite ??
                            'Não foi possível registrar o aceite. Tente de novo.',
                    ),
                onFinish: () => setEnviando(false),
            },
        );
    };

    return (
        <Dialog open={aberto} onOpenChange={() => {}}>
            <DialogContent
                onEscapeKeyDown={(e) => e.preventDefault()}
                onPointerDownOutside={(e) => e.preventDefault()}
                onInteractOutside={(e) => e.preventDefault()}
                // Foco inicial no texto (e não na 1ª aba, que ganhava um
                // contorno grosso): também permite rolar com as setas.
                onOpenAutoFocus={(e) => {
                    e.preventDefault();
                    rolagem.current?.focus();
                }}
                className="flex max-h-[92dvh] w-[calc(100vw-1.5rem)] max-w-3xl flex-col gap-0 overflow-hidden rounded-3xl border-border/70 p-0 sm:max-w-3xl [&>button:last-child]:hidden"
            >
                {/* Cabeçalho */}
                <div className="relative shrink-0 overflow-hidden border-b border-border/70 bg-gradient-to-br from-emerald-500/[0.12] via-background to-background px-5 pt-6 pb-4 sm:px-8">
                    <div className="pointer-events-none absolute -top-16 -right-10 h-44 w-44 rounded-full bg-emerald-500/15 blur-3xl" />
                    <div className="relative flex items-start gap-4">
                        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 text-white shadow-lg shadow-emerald-500/30">
                            <ShieldCheck className="size-6" />
                        </span>
                        <div className="min-w-0">
                            <p className="text-[10px] font-bold tracking-[0.16em] text-emerald-600 uppercase">
                                {termos.atualizacao
                                    ? 'Atualização dos termos'
                                    : 'Primeiro acesso'}
                            </p>
                            <DialogTitle className="mt-0.5 text-lg font-bold tracking-tight sm:text-xl">
                                {termos.atualizacao
                                    ? 'Atualizamos nossos termos'
                                    : `Boas-vindas ao PayFlow${primeiroNome ? `, ${primeiroNome}` : ''}!`}
                            </DialogTitle>
                            <DialogDescription className="mt-1 text-sm leading-relaxed">
                                Antes de começar, leia os documentos abaixo até
                                o fim. Eles explicam as regras de uso, como os
                                dados dos clientes são tratados e o seu
                                compromisso de sigilo.
                            </DialogDescription>
                        </div>
                    </div>

                    {/* Abas dos documentos */}
                    <div
                        role="tablist"
                        className="relative mt-5 grid grid-cols-3 gap-1 rounded-2xl bg-muted/70 p-1"
                    >
                        {documentos.map((d) => {
                            const lido = lidos.has(d.id);

                            return (
                                <button
                                    key={d.id}
                                    type="button"
                                    role="tab"
                                    aria-selected={atual === d.id}
                                    onClick={() => setAtual(d.id)}
                                    className={`flex h-10 items-center justify-center gap-1.5 rounded-xl px-2 text-[11px] font-bold transition-all focus-visible:ring-2 focus-visible:ring-emerald-500/40 focus-visible:outline-none sm:text-xs ${
                                        atual === d.id
                                            ? 'bg-card text-foreground shadow-sm'
                                            : 'text-muted-foreground hover:text-foreground'
                                    }`}
                                >
                                    <span
                                        className={`flex size-4 shrink-0 items-center justify-center rounded-full transition-colors ${
                                            lido
                                                ? 'bg-emerald-500 text-white'
                                                : 'border border-muted-foreground/40'
                                        }`}
                                    >
                                        {lido && (
                                            <Check
                                                className="size-2.5"
                                                strokeWidth={4}
                                            />
                                        )}
                                    </span>
                                    <span className="truncate">
                                        {d.tituloCurto}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Documento atual */}
                <div
                    ref={rolagem}
                    tabIndex={-1}
                    onScroll={conferirLeitura}
                    className="min-h-0 flex-1 overflow-y-auto px-5 py-6 outline-none sm:px-8"
                >
                    <div className="mb-5 flex flex-wrap items-baseline justify-between gap-2">
                        <h2 className="text-base font-bold tracking-tight text-foreground sm:text-lg">
                            {documento.titulo}
                        </h2>
                        <span className="text-[11px] text-muted-foreground">
                            Versão {termos.versao} · vigente desde{' '}
                            {formatarData(termos.vigenteDesde)}
                        </span>
                    </div>
                    <Documento documento={documento} />

                    {/* Fim do documento */}
                    <div className="mt-8 flex flex-col items-center gap-3 border-t border-dashed border-border pt-6 text-center">
                        <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
                            <Check className="size-4" /> Fim do documento
                        </span>
                        {proximoNaoLido && (
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setAtual(proximoNaoLido.id)}
                                className="h-10 rounded-xl font-bold"
                            >
                                Ler {proximoNaoLido.titulo}
                            </Button>
                        )}
                    </div>
                </div>

                {/* Rodapé: aceite */}
                <div className="shrink-0 border-t border-border/70 bg-card px-5 py-4 sm:px-8">
                    <label
                        className={`flex items-start gap-3 rounded-xl border p-3 text-sm transition-colors ${
                            todosLidos
                                ? 'cursor-pointer border-emerald-500/30 bg-emerald-500/[0.05]'
                                : 'cursor-not-allowed border-border/70 opacity-60'
                        }`}
                    >
                        <input
                            type="checkbox"
                            checked={concordo}
                            disabled={!todosLidos}
                            onChange={(e) => setConcordo(e.target.checked)}
                            className="mt-0.5 size-4 shrink-0 accent-emerald-600"
                        />
                        <span className="leading-snug text-foreground">
                            {todosLidos
                                ? `Li e concordo com os Termos de Uso, a Política de Privacidade e o Termo de Confidencialidade (versão ${termos.versao}).`
                                : `Leia os 3 documentos até o fim para continuar (${lidos.size} de ${documentos.length} lidos).`}
                        </span>
                    </label>

                    {erro && (
                        <p className="mt-2 text-xs font-semibold text-red-600">
                            {erro}
                        </p>
                    )}

                    <div className="mt-3 flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <Link
                            href={logout()}
                            as="button"
                            onClick={() => router.flushAll()}
                            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        >
                            <LogOut className="size-4" />
                            Não concordo, sair
                        </Link>
                        <Button
                            type="button"
                            onClick={aceitar}
                            disabled={!concordo || !todosLidos || enviando}
                            className="h-11 rounded-xl bg-emerald-500 px-6 font-bold text-white shadow-lg shadow-emerald-500/25 hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
                        >
                            {enviando ? (
                                <Loader2 className="mr-2 size-4 animate-spin" />
                            ) : (
                                <Check className="mr-2 size-4" />
                            )}
                            Aceitar e continuar
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
