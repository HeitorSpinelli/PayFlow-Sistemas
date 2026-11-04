import { CircleCheck, Download, Info, TriangleAlert } from 'lucide-react';
import { useState } from 'react';
import type { Mensagem } from './tipos';
import { baixarMensagens } from './tipos';

type Aba = 'erros' | 'avisos';

/**
 * Problemas e avisos por linha, em abas, com download da lista em CSV para
 * corrigir no Excel. Na prévia, sem nenhum dos dois, mostra que está tudo
 * certo.
 */
export default function Mensagens({
    erros,
    totalErros,
    avisos,
    totalAvisos,
    rotuloErros,
    nomeArquivo,
    mostrarTudoCerto = false,
}: {
    erros: Mensagem[];
    totalErros: number;
    avisos: Mensagem[];
    totalAvisos: number;
    rotuloErros: string;
    nomeArquivo?: string;
    mostrarTudoCerto?: boolean;
}) {
    const [aba, setAba] = useState<Aba>(erros.length > 0 ? 'erros' : 'avisos');

    if (erros.length === 0 && avisos.length === 0) {
        return mostrarTudoCerto ? (
            <div className="flex items-center gap-3 rounded-2xl border border-emerald-500/25 bg-emerald-500/[0.06] px-4 py-3 text-sm text-emerald-700 dark:text-emerald-400">
                <CircleCheck className="size-5 shrink-0" />
                Nenhum problema encontrado — todas as linhas estão prontas.
            </div>
        ) : null;
    }

    const lista = aba === 'erros' ? erros : avisos;
    const total = aba === 'erros' ? totalErros : totalAvisos;
    const base = (nomeArquivo ?? 'planilha').replace(/\.[^.]+$/, '');

    const abas: { id: Aba; rotulo: string; total: number; cor: string }[] = [
        {
            id: 'erros',
            rotulo: rotuloErros,
            total: totalErros,
            cor: 'text-red-600',
        },
        {
            id: 'avisos',
            rotulo: 'Avisos',
            total: totalAvisos,
            cor: 'text-amber-600',
        },
    ];

    return (
        <div className="overflow-hidden rounded-2xl border border-border/70 bg-background">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/70 p-2">
                <div
                    role="tablist"
                    className="flex gap-1 rounded-xl bg-muted/60 p-1"
                >
                    {abas
                        .filter((a) => a.total > 0)
                        .map((a) => (
                            <button
                                key={a.id}
                                type="button"
                                role="tab"
                                aria-selected={aba === a.id}
                                onClick={() => setAba(a.id)}
                                className={`flex h-9 items-center gap-2 rounded-lg px-3 text-xs font-bold transition-all ${
                                    aba === a.id
                                        ? 'bg-card text-foreground shadow-sm'
                                        : 'text-muted-foreground hover:text-foreground'
                                }`}
                            >
                                {a.id === 'erros' ? (
                                    <TriangleAlert
                                        className={`size-3.5 ${a.cor}`}
                                    />
                                ) : (
                                    <Info className={`size-3.5 ${a.cor}`} />
                                )}
                                {a.rotulo}
                                <span
                                    className={`rounded-md px-1.5 py-0.5 text-[10px] ${
                                        a.id === 'erros'
                                            ? 'bg-red-500/10 text-red-600'
                                            : 'bg-amber-500/10 text-amber-700 dark:text-amber-400'
                                    }`}
                                >
                                    {a.total.toLocaleString('pt-BR')}
                                </span>
                            </button>
                        ))}
                </div>

                <button
                    type="button"
                    onClick={() =>
                        baixarMensagens(
                            `${base}-${aba === 'erros' ? 'problemas' : 'avisos'}.csv`,
                            lista,
                        )
                    }
                    className="flex h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                    <Download className="size-3.5" />
                    Baixar lista
                </button>
            </div>

            <ul
                key={aba}
                className="max-h-80 animate-in divide-y divide-border/50 overflow-y-auto duration-200 fade-in"
            >
                {lista.map((m, i) => (
                    <li
                        key={i}
                        className="flex items-start gap-3 px-4 py-3 text-sm"
                    >
                        <span
                            className={`mt-px shrink-0 rounded-md px-2 py-0.5 text-[11px] font-bold whitespace-nowrap tabular-nums ${
                                aba === 'erros'
                                    ? 'bg-red-500/10 text-red-700 dark:text-red-400'
                                    : 'bg-amber-500/10 text-amber-800 dark:text-amber-300'
                            }`}
                        >
                            {m.linha !== null ? `Linha ${m.linha}` : 'Geral'}
                        </span>
                        <span className="leading-relaxed text-foreground">
                            {m.mensagem}
                        </span>
                    </li>
                ))}
            </ul>

            {total > lista.length && (
                <p className="border-t border-border/50 px-4 py-2.5 text-xs text-muted-foreground">
                    Mostrando {lista.length.toLocaleString('pt-BR')} de{' '}
                    {total.toLocaleString('pt-BR')}. Corrija estes e envie de
                    novo para ver os demais.
                </p>
            )}
        </div>
    );
}
