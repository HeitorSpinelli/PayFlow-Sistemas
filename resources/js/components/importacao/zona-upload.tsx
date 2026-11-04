import {
    AlertTriangle,
    FileSpreadsheet,
    Repeat2,
    ShieldCheck,
    Upload,
} from 'lucide-react';
import { useState } from 'react';
import type { DragEvent, KeyboardEvent } from 'react';
import { Button } from '@/components/ui/button';

/**
 * Estado inicial do painel da tela Importar: área para arrastar/escolher a
 * planilha, com os três "combinados" da importação logo abaixo.
 */
export default function ZonaUpload({
    onArquivo,
    onAbrir,
    limiteMb,
    erro,
}: {
    onArquivo: (arquivo: File) => void;
    onAbrir: () => void;
    limiteMb: number;
    erro: string | null;
}) {
    const [arrastando, setArrastando] = useState(false);

    const soltar = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setArrastando(false);
        const arquivo = e.dataTransfer.files?.[0];

        if (arquivo) {
            onArquivo(arquivo);
        }
    };

    // Acessibilidade: Enter/Espaço abre o seletor de arquivo.
    const tecla = (e: KeyboardEvent<HTMLDivElement>) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onAbrir();
        }
    };

    return (
        <div className="flex animate-in flex-col gap-5 duration-300 fade-in">
            <div
                onClick={onAbrir}
                onDragOver={(e) => {
                    e.preventDefault();
                    setArrastando(true);
                }}
                onDragLeave={() => setArrastando(false)}
                onDrop={soltar}
                role="button"
                tabIndex={0}
                onKeyDown={tecla}
                aria-label="Escolher planilha para importar"
                className={`group relative flex cursor-pointer flex-col items-center justify-center gap-5 overflow-hidden rounded-2xl border-2 border-dashed px-5 py-12 text-center transition-all duration-300 focus-visible:ring-4 focus-visible:ring-emerald-500/20 focus-visible:outline-none sm:py-16 ${
                    arrastando
                        ? 'scale-[1.01] border-emerald-500 bg-emerald-500/[0.07]'
                        : 'border-border bg-gradient-to-b from-emerald-500/[0.03] to-transparent hover:border-emerald-500/50 hover:from-emerald-500/[0.06]'
                }`}
            >
                {/* Ícone da planilha com as extensões aceitas */}
                <div className="relative">
                    <span
                        className={`flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-emerald-400 to-emerald-600 text-white shadow-xl shadow-emerald-500/30 transition-transform duration-300 ${
                            arrastando
                                ? '-translate-y-1 rotate-[-4deg]'
                                : 'group-hover:-translate-y-1'
                        }`}
                    >
                        {arrastando ? (
                            <Upload className="size-9" />
                        ) : (
                            <FileSpreadsheet className="size-9" />
                        )}
                    </span>
                    <span className="absolute -top-2 -right-7 rounded-md border border-emerald-500/30 bg-card px-1.5 py-0.5 text-[10px] font-bold text-emerald-600 shadow-sm">
                        .xlsx
                    </span>
                    <span className="absolute -bottom-2 -left-6 rounded-md border border-border bg-card px-1.5 py-0.5 text-[10px] font-bold text-muted-foreground shadow-sm">
                        .csv
                    </span>
                </div>

                <div>
                    <p className="text-lg font-bold tracking-tight text-foreground sm:text-xl">
                        {arrastando
                            ? 'Pode soltar o arquivo'
                            : 'Arraste sua planilha para cá'}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Excel (.xlsx) ou .csv · até {limiteMb} MB
                    </p>
                </div>

                <Button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        onAbrir();
                    }}
                    className="h-11 rounded-xl bg-emerald-500 px-7 font-bold text-white shadow-lg shadow-emerald-500/25 transition-all hover:bg-emerald-600 active:scale-[0.98] max-sm:w-full"
                >
                    <Upload className="mr-2 size-4" />
                    Escolher arquivo
                </Button>
            </div>

            {erro && (
                <div
                    role="alert"
                    className="flex animate-in items-start gap-2.5 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-700 duration-200 fade-in slide-in-from-top-1 dark:text-red-400"
                >
                    <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                    {erro}
                </div>
            )}

            {/* Os combinados da importação */}
            <ul className="grid gap-3 sm:grid-cols-3">
                {[
                    {
                        icone: ShieldCheck,
                        titulo: 'Confere antes',
                        texto: 'Nada é gravado até você ver a prévia e confirmar.',
                    },
                    {
                        icone: FileSpreadsheet,
                        titulo: 'Do jeito do Excel',
                        texto: 'Datas 10/12/2026, valores 1.234,56 e nomes de coluna livres.',
                    },
                    {
                        icone: Repeat2,
                        titulo: 'Não duplica',
                        texto: 'Enviar a mesma planilha de novo só atualiza o que mudou.',
                    },
                ].map(({ icone: Icone, titulo, texto }) => (
                    <li
                        key={titulo}
                        className="flex items-start gap-3 rounded-xl border border-border/60 bg-background/60 p-3"
                    >
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600">
                            <Icone className="size-4" />
                        </span>
                        <span>
                            <span className="block text-xs font-bold text-foreground">
                                {titulo}
                            </span>
                            <span className="mt-0.5 block text-[11px] leading-relaxed text-muted-foreground">
                                {texto}
                            </span>
                        </span>
                    </li>
                ))}
            </ul>
        </div>
    );
}
