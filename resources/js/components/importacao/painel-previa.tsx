import {
    AlertTriangle,
    FileSpreadsheet,
    Loader2,
    Sparkles,
    X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Faltantes from './faltantes';
import GradeAcoes from './grade-acoes';
import Mensagens from './mensagens';
import type { Resumo } from './tipos';
import { formatarTamanho, plural } from './tipos';

// Anel com a proporção de linhas prontas (verde) e com problema (vermelho).
function AnelProporcao({ validas, total }: { validas: number; total: number }) {
    const raio = 36;
    const circunferencia = 2 * Math.PI * raio;
    const fracao = total > 0 ? validas / total : 0;
    const temProblema = validas < total;

    return (
        <div className="relative h-24 w-24 shrink-0">
            <svg viewBox="0 0 88 88" className="h-full w-full -rotate-90">
                <circle
                    cx="44"
                    cy="44"
                    r={raio}
                    fill="none"
                    strokeWidth="9"
                    className={
                        temProblema ? 'stroke-red-500/25' : 'stroke-muted'
                    }
                />
                <circle
                    cx="44"
                    cy="44"
                    r={raio}
                    fill="none"
                    strokeWidth="9"
                    strokeLinecap="round"
                    strokeDasharray={circunferencia}
                    strokeDashoffset={circunferencia * (1 - fracao)}
                    className="stroke-emerald-500 transition-[stroke-dashoffset] duration-700 ease-out"
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-lg leading-none font-bold text-foreground tabular-nums">
                    {Math.round(fracao * 100)}%
                </span>
                <span className="mt-0.5 text-[10px] font-medium text-muted-foreground">
                    prontas
                </span>
            </div>
        </div>
    );
}

/**
 * Prévia da importação (fases "previa" e "importando" da tela Importar):
 * quantas linhas entram, o que vai ser criado, o que falta cadastrar e os
 * problemas/avisos por linha. Nada foi gravado ainda.
 */
export default function PainelPrevia({
    resumo,
    arquivo,
    importando,
    progresso,
    erro,
    isAdmin,
    onImportar,
    onTrocar,
    onCancelar,
}: {
    resumo: Resumo;
    arquivo: File;
    importando: boolean;
    progresso?: number;
    erro: string | null;
    isAdmin: boolean;
    onImportar: () => void;
    onTrocar: () => void;
    onCancelar: () => void;
}) {
    const comErro = resumo.comErro ?? 0;
    const tudoCerto = resumo.validas > 0 && resumo.validas === resumo.total;

    // Todas as linhas válidas já estão cadastradas exatamente assim: importar
    // de novo não mudaria nada.
    const c = resumo.contagem;
    const nadaNovo =
        resumo.validas > 0 &&
        !!c &&
        c.clientesNovos +
            c.clientesAtualizados +
            c.apolicesNovas +
            c.apolicesAtualizadas +
            c.parcelasNovas +
            c.parcelasAtualizadas +
            c.pagamentosRegistrados ===
            0;

    const [titulo, subtitulo] = nadaNovo
        ? [
              'Esta planilha já está no sistema',
              `${plural(resumo.validas, 'A linha válida já está cadastrada', 'As linhas válidas já estão cadastradas')} exatamente assim — importar de novo não mudaria nada.`,
          ]
        : tudoCerto
          ? [
                'Tudo certo para importar',
                `${plural(resumo.total, 'linha passou', 'linhas passaram')} na conferência.`,
            ]
          : resumo.validas > 0
            ? [
                  `${resumo.validas.toLocaleString('pt-BR')} de ${plural(resumo.total, 'linha pronta', 'linhas prontas')}`,
                  `${plural(comErro, 'linha com problema fica', 'linhas com problema ficam')} de fora. Dá para importar as boas agora e corrigir o resto depois — nada duplica.`,
              ]
            : [
                  'Nenhuma linha pronta para importar',
                  'Corrija os problemas abaixo na planilha e envie de novo.',
              ];

    return (
        <div className="flex animate-in flex-col gap-5 duration-300 fade-in slide-in-from-bottom-2">
            {/* Arquivo escolhido */}
            <div className="flex items-center gap-3 rounded-2xl border border-border/70 bg-background px-3 py-2.5">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
                    <FileSpreadsheet className="size-5" />
                </span>
                <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-foreground">
                        {arquivo.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                        {formatarTamanho(arquivo.size)}
                        {resumo.total > 0 &&
                            ` · ${plural(resumo.total, 'linha', 'linhas')} de dados`}
                    </p>
                </div>
                {!importando && (
                    <>
                        <button
                            type="button"
                            onClick={onTrocar}
                            className="hidden h-9 rounded-lg px-3 text-xs font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:block"
                        >
                            Trocar
                        </button>
                        <button
                            type="button"
                            onClick={onCancelar}
                            aria-label="Cancelar e escolher outro arquivo"
                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        >
                            <X className="size-4" />
                        </button>
                    </>
                )}
            </div>

            {resumo.erroGeral ? (
                <div className="flex flex-col items-center gap-4 rounded-2xl border border-red-500/20 bg-red-500/[0.06] px-5 py-10 text-center">
                    <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10 text-red-600">
                        <AlertTriangle className="size-7" />
                    </span>
                    <div className="max-w-md">
                        <p className="text-lg font-bold tracking-tight text-foreground">
                            Não dá para importar esta planilha
                        </p>
                        <p className="mt-1.5 text-sm leading-relaxed text-red-700 dark:text-red-400">
                            {resumo.erroGeral}
                        </p>
                    </div>
                    <Button
                        onClick={onTrocar}
                        className="h-11 rounded-xl bg-emerald-500 px-6 font-bold text-white hover:bg-emerald-600 max-sm:w-full"
                    >
                        Escolher outro arquivo
                    </Button>
                </div>
            ) : (
                <>
                    {/* Resumo da conferência */}
                    <div
                        className={`flex items-center gap-5 rounded-2xl border p-4 sm:p-5 ${
                            tudoCerto
                                ? 'border-emerald-500/25 bg-gradient-to-br from-emerald-500/[0.08] to-transparent'
                                : resumo.validas > 0
                                  ? 'border-border/70 bg-background'
                                  : 'border-red-500/20 bg-red-500/[0.05]'
                        }`}
                    >
                        <AnelProporcao
                            validas={resumo.validas}
                            total={resumo.total}
                        />
                        <div className="min-w-0">
                            <p className="text-lg leading-snug font-bold tracking-tight text-foreground sm:text-xl">
                                {titulo}
                            </p>
                            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                                {subtitulo}
                            </p>
                        </div>
                    </div>

                    {resumo.contagem && resumo.validas > 0 && (
                        <section>
                            <h3 className="mb-2.5 text-[11px] font-bold tracking-[0.12em] text-muted-foreground uppercase">
                                O que vai acontecer
                            </h3>
                            <GradeAcoes contagem={resumo.contagem} />
                        </section>
                    )}

                    <Faltantes resumo={resumo} isAdmin={isAdmin} />

                    <Mensagens
                        key={arquivo.name + arquivo.size}
                        erros={resumo.erros ?? []}
                        totalErros={resumo.totalErros ?? 0}
                        avisos={resumo.avisos ?? []}
                        totalAvisos={resumo.totalAvisos ?? 0}
                        rotuloErros="Problemas"
                        nomeArquivo={arquivo.name}
                        mostrarTudoCerto
                    />

                    {erro && (
                        <div
                            role="alert"
                            className="flex items-start gap-2.5 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-700 dark:text-red-400"
                        >
                            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                            {erro}
                        </div>
                    )}

                    {/* Barra de ação: fica presa no rodapé da tela enquanto
                        a lista de problemas é longa */}
                    <div className="sticky bottom-0 z-20 -mx-4 -mb-4 border-t border-border/70 bg-card/95 px-4 py-4 backdrop-blur supports-[backdrop-filter]:bg-card/80 sm:-mx-8 sm:-mb-8 sm:px-8 sm:py-5">
                        {importando && (
                            <div className="mb-3">
                                <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                                    <div
                                        className="h-full rounded-full bg-emerald-500 transition-all duration-300"
                                        style={{
                                            width: `${progresso ?? 100}%`,
                                        }}
                                    />
                                </div>
                                <p className="mt-1.5 text-xs font-semibold text-muted-foreground">
                                    {progresso !== undefined && progresso < 100
                                        ? `Enviando… ${progresso}%`
                                        : 'Gravando no sistema…'}
                                </p>
                            </div>
                        )}

                        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end">
                            <Button
                                onClick={onTrocar}
                                disabled={importando}
                                variant="outline"
                                className="h-11 rounded-xl px-5 font-bold"
                            >
                                Trocar arquivo
                            </Button>
                            <Button
                                onClick={onImportar}
                                disabled={
                                    importando ||
                                    resumo.validas === 0 ||
                                    nadaNovo
                                }
                                className="h-11 rounded-xl bg-emerald-500 px-6 font-bold text-white shadow-lg shadow-emerald-500/25 transition-all hover:bg-emerald-600 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
                            >
                                {importando ? (
                                    <Loader2 className="mr-2 size-4 animate-spin" />
                                ) : (
                                    <Sparkles className="mr-2 size-4" />
                                )}
                                {importando
                                    ? 'Importando…'
                                    : resumo.validas === 0
                                      ? 'Nada para importar'
                                      : nadaNovo
                                        ? 'Nada novo para importar'
                                        : comErro > 0
                                          ? `Importar ${plural(resumo.validas, 'linha válida', 'linhas válidas')}`
                                          : `Importar ${plural(resumo.validas, 'linha', 'linhas')}`}
                            </Button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
