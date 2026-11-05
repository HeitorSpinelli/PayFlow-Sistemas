import { Head, usePage } from '@inertiajs/react';
import { ChevronRight, Printer, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { documentosLegais, formatarData } from '@/components/termos/conteudo';
import type { DocumentoLegal } from '@/components/termos/conteudo';
import Documento from '@/components/termos/documento';
import type { TermosCompartilhados } from '@/components/termos/modal-termos';

/**
 * Tela "Termos e Privacidade" — URL /termos (TermosController::index), aberta
 * pelo menu do usuário. Mostra os mesmos documentos da janela de aceite do
 * primeiro acesso, em abas, e quando o usuário os aceitou. Usa a prop
 * compartilhada `termos` (HandleInertiaRequests).
 */
export default function Termos() {
    const { props } = usePage<{ termos?: TermosCompartilhados | null }>();
    const termos = props.termos;
    const [atual, setAtual] = useState<DocumentoLegal['id']>('termos');

    if (!termos) {
        return null;
    }

    const documentos = documentosLegais({
        responsavel: termos.responsavel,
        contato: termos.contato,
        versao: termos.versao,
        vigenteDesde: termos.vigenteDesde,
    });
    const documento = documentos.find((d) => d.id === atual) ?? documentos[0];
    const aceitoEm = termos.aceitoEm ? new Date(termos.aceitoEm) : null;

    return (
        <>
            <Head title="Termos e Privacidade" />

            <div className="flex flex-col gap-6 p-6 max-sm:gap-5 max-sm:p-4 sm:p-8">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <div className="mb-1 flex items-center gap-1.5 text-[10px] font-bold tracking-[0.16em] text-emerald-600 uppercase">
                            <span>Suporte</span>
                            <ChevronRight className="h-3 w-3" />
                            <span>Termos e Privacidade</span>
                        </div>
                        <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
                            Termos e Privacidade
                        </h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Versão {termos.versao}, vigente desde{' '}
                            {formatarData(termos.vigenteDesde)}.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => window.print()}
                        className="inline-flex h-10 items-center gap-2 self-start rounded-xl border border-border/70 bg-background px-4 text-sm font-semibold transition-colors hover:bg-muted sm:self-auto print:hidden"
                    >
                        <Printer className="size-4" />
                        Imprimir
                    </button>
                </div>

                {aceitoEm && (
                    <div className="flex items-center gap-3 rounded-2xl border border-emerald-500/25 bg-emerald-500/[0.06] px-4 py-3 text-sm print:hidden">
                        <ShieldCheck className="size-5 shrink-0 text-emerald-600" />
                        <span>
                            Você aceitou a versão{' '}
                            <strong>{termos.versaoAceita}</strong> em{' '}
                            {aceitoEm.toLocaleDateString('pt-BR')} às{' '}
                            {aceitoEm.toLocaleTimeString('pt-BR', {
                                hour: '2-digit',
                                minute: '2-digit',
                            })}
                            .
                        </span>
                    </div>
                )}

                <div className="overflow-hidden rounded-3xl border border-border/70 bg-card shadow-sm">
                    <div
                        role="tablist"
                        className="flex gap-1 overflow-x-auto border-b border-border/70 p-2 print:hidden"
                    >
                        {documentos.map((d) => (
                            <button
                                key={d.id}
                                type="button"
                                role="tab"
                                aria-selected={atual === d.id}
                                onClick={() => setAtual(d.id)}
                                className={`h-10 shrink-0 rounded-xl px-4 text-sm font-bold transition-colors ${
                                    atual === d.id
                                        ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                                }`}
                            >
                                {d.titulo}
                            </button>
                        ))}
                    </div>

                    <div className="mx-auto max-w-3xl px-5 py-8 sm:px-10">
                        <h2 className="mb-5 text-lg font-bold tracking-tight text-foreground sm:text-xl">
                            {documento.titulo}
                        </h2>
                        <Documento documento={documento} />
                    </div>
                </div>
            </div>
        </>
    );
}
