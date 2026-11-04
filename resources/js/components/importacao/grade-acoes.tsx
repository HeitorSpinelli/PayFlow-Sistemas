import { CalendarClock, FileCheck, Users, Wallet } from 'lucide-react';
import type { Contagem } from './tipos';
import { plural } from './tipos';

/**
 * Grade com o que a importação faz (prévia) ou fez (resultado): clientes,
 * apólices, parcelas e pagamentos — novos em destaque, atualizados e
 * inalterados embaixo.
 */
export default function GradeAcoes({ contagem }: { contagem: Contagem }) {
    const cartoes = [
        {
            icone: Users,
            titulo: 'Clientes',
            novos: contagem.clientesNovos,
            rotuloNovos: ['novo', 'novos'],
            extra:
                contagem.clientesAtualizados > 0
                    ? plural(
                          contagem.clientesAtualizados,
                          'atualizado',
                          'atualizados',
                      )
                    : null,
        },
        {
            icone: FileCheck,
            titulo: 'Apólices',
            novos: contagem.apolicesNovas,
            rotuloNovos: ['nova', 'novas'],
            extra:
                contagem.apolicesAtualizadas > 0
                    ? plural(
                          contagem.apolicesAtualizadas,
                          'atualizada',
                          'atualizadas',
                      )
                    : null,
        },
        {
            icone: CalendarClock,
            titulo: 'Parcelas',
            novos: contagem.parcelasNovas,
            rotuloNovos: ['nova', 'novas'],
            extra:
                [
                    contagem.parcelasAtualizadas > 0
                        ? plural(
                              contagem.parcelasAtualizadas,
                              'atualizada',
                              'atualizadas',
                          )
                        : null,
                    contagem.parcelasSemMudanca > 0
                        ? plural(
                              contagem.parcelasSemMudanca,
                              'já igual',
                              'já iguais',
                          )
                        : null,
                ]
                    .filter(Boolean)
                    .join(' · ') || null,
        },
        {
            icone: Wallet,
            titulo: 'Pagamentos',
            novos: contagem.pagamentosRegistrados,
            rotuloNovos: ['lançado', 'lançados'],
            extra: null,
        },
    ];

    return (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {cartoes.map(
                ({ icone: Icone, titulo, novos, rotuloNovos, extra }) => {
                    const vazio = novos === 0 && !extra;

                    return (
                        <div
                            key={titulo}
                            className={`rounded-2xl border p-4 transition-opacity ${
                                vazio
                                    ? 'border-border/60 bg-background/40 opacity-60'
                                    : 'border-border/70 bg-background'
                            }`}
                        >
                            <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                                <span
                                    className={`flex h-7 w-7 items-center justify-center rounded-lg ${
                                        vazio
                                            ? 'bg-muted text-muted-foreground'
                                            : 'bg-emerald-500/10 text-emerald-600'
                                    }`}
                                >
                                    <Icone className="size-3.5" />
                                </span>
                                {titulo}
                            </div>
                            <p className="mt-3 text-2xl font-bold tracking-tight text-foreground">
                                {novos.toLocaleString('pt-BR')}
                                <span className="ml-1.5 text-xs font-semibold text-muted-foreground">
                                    {novos === 1
                                        ? rotuloNovos[0]
                                        : rotuloNovos[1]}
                                </span>
                            </p>
                            <p className="mt-0.5 min-h-4 text-[11px] text-muted-foreground">
                                {extra ?? ' '}
                            </p>
                        </div>
                    );
                },
            )}
        </div>
    );
}
