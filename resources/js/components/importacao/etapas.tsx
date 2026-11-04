import { Check, Loader2, X } from 'lucide-react';
import type { Fase } from './tipos';

const ETAPAS = ['Escolher planilha', 'Conferir prévia', 'Importar'];

type Estado = 'feita' | 'atual' | 'carregando' | 'falhou' | 'pendente';

// Estado de cada etapa a partir da fase da tela.
function estados(fase: Fase, falhou: boolean): Estado[] {
    switch (fase) {
        case 'inicial':
            return ['atual', 'pendente', 'pendente'];
        case 'verificando':
            return ['feita', 'carregando', 'pendente'];
        case 'previa':
            return ['feita', 'atual', 'pendente'];
        case 'importando':
            return ['feita', 'feita', 'carregando'];
        case 'resultado':
            return ['feita', 'feita', falhou ? 'falhou' : 'feita'];
    }
}

/**
 * Barra "Escolher planilha → Conferir prévia → Importar" no topo do painel
 * principal da tela Importar.
 */
export default function EtapasImportacao({
    fase,
    falhou = false,
}: {
    fase: Fase;
    falhou?: boolean;
}) {
    const lista = estados(fase, falhou);

    return (
        <ol className="flex items-start">
            {ETAPAS.map((titulo, i) => {
                const estado = lista[i];
                const ativa = estado !== 'pendente';

                return (
                    <li
                        key={titulo}
                        className="relative flex flex-1 flex-col items-center gap-2 text-center"
                    >
                        {/* Linha que liga à etapa anterior */}
                        {i > 0 && (
                            <span
                                aria-hidden
                                className={`absolute top-4 right-1/2 h-0.5 w-full -translate-y-1/2 rounded-full transition-colors duration-500 ${
                                    ativa ? 'bg-emerald-500' : 'bg-border'
                                }`}
                            />
                        )}

                        <span
                            className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all duration-300 ${
                                estado === 'feita'
                                    ? 'bg-emerald-500 text-white'
                                    : estado === 'falhou'
                                      ? 'bg-red-500 text-white'
                                      : estado === 'pendente'
                                        ? 'border-2 border-border bg-card text-muted-foreground'
                                        : 'bg-emerald-500 text-white shadow-[0_0_0_5px] shadow-emerald-500/20'
                            }`}
                        >
                            {estado === 'feita' ? (
                                <Check className="size-4" strokeWidth={3} />
                            ) : estado === 'falhou' ? (
                                <X className="size-4" strokeWidth={3} />
                            ) : estado === 'carregando' ? (
                                <Loader2 className="size-4 animate-spin" />
                            ) : (
                                i + 1
                            )}
                        </span>

                        <span
                            className={`text-[11px] font-semibold sm:text-xs ${
                                estado === 'pendente'
                                    ? 'text-muted-foreground'
                                    : estado === 'falhou'
                                      ? 'text-red-600'
                                      : 'text-foreground'
                            }`}
                        >
                            {titulo}
                        </span>
                    </li>
                );
            })}
        </ol>
    );
}
