import { FileSpreadsheet } from 'lucide-react';
import { formatarTamanho } from './tipos';

// O que a prévia confere (ImportacaoSeguradosService::analisar). Só uma
// lista do que está acontecendo — não é progresso real, por isso todos os
// itens pulsam juntos em vez de "marcar" um a um.
const CONFERENCIAS = [
    'Lendo as linhas da planilha',
    'Validando CPFs, datas e valores',
    'Conferindo seguradoras e ramos',
    'Comparando com o que já está cadastrado',
];

/**
 * Painel enquanto a prévia é calculada (POST /importar-dados/verificar).
 */
export default function Verificando({ arquivo }: { arquivo: File }) {
    return (
        <div className="flex animate-in flex-col items-center gap-6 py-8 text-center duration-300 fade-in">
            <div className="relative flex h-24 w-24 items-center justify-center">
                <span className="absolute inset-0 animate-spin rounded-full border-4 border-emerald-500/15 border-t-emerald-500 [animation-duration:1.1s]" />
                <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600">
                    <FileSpreadsheet className="size-8" />
                </span>
            </div>

            <div className="max-w-full min-w-0">
                <p className="text-lg font-bold tracking-tight text-foreground">
                    Conferindo sua planilha…
                </p>
                <p className="mt-1 truncate text-sm text-muted-foreground">
                    {arquivo.name} · {formatarTamanho(arquivo.size)}
                </p>
            </div>

            <ul className="flex w-full max-w-sm flex-col gap-2 text-left">
                {CONFERENCIAS.map((texto, i) => (
                    <li
                        key={texto}
                        className="flex items-center gap-3 rounded-xl border border-border/60 bg-background/60 px-4 py-2.5 text-sm text-muted-foreground"
                    >
                        <span
                            className="size-2 shrink-0 animate-pulse rounded-full bg-emerald-500"
                            style={{ animationDelay: `${i * 150}ms` }}
                        />
                        {texto}
                    </li>
                ))}
            </ul>

            <p className="text-xs text-muted-foreground">
                Nada é gravado nesta etapa.
            </p>
        </div>
    );
}
