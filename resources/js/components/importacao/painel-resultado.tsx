import { Link } from '@inertiajs/react';
import {
    AlertTriangle,
    ArrowRight,
    CircleCheck,
    FileCheck,
    RotateCcw,
    Upload,
    Users,
    Wallet,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Faltantes from './faltantes';
import GradeAcoes from './grade-acoes';
import Mensagens from './mensagens';
import type { Resumo } from './tipos';
import { plural } from './tipos';

/**
 * Resultado da importação (fase "resultado" da tela Importar), a partir do
 * flash importResumo: o que foi criado, o que ficou de fora e para onde ir.
 */
export default function PainelResultado({
    resumo,
    isAdmin,
    onNovo,
}: {
    resumo: Resumo;
    isAdmin: boolean;
    onNovo: () => void;
}) {
    if (resumo.erroGeral) {
        return (
            <div className="flex animate-in flex-col items-center gap-4 rounded-2xl border border-red-500/20 bg-red-500/[0.06] px-5 py-12 text-center duration-300 fade-in">
                <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10 text-red-600">
                    <AlertTriangle className="size-8" />
                </span>
                <div className="max-w-md">
                    <p className="text-xl font-bold tracking-tight text-foreground">
                        Nada foi importado
                    </p>
                    <p className="mt-1.5 text-sm leading-relaxed text-red-700 dark:text-red-400">
                        {resumo.erroGeral}
                    </p>
                </div>
                <Button
                    onClick={onNovo}
                    className="h-11 rounded-xl bg-emerald-500 px-6 font-bold text-white hover:bg-emerald-600 max-sm:w-full"
                >
                    <RotateCcw className="mr-2 size-4" />
                    Tentar de novo
                </Button>
            </div>
        );
    }

    const atalhos = [
        { href: '/clientes', rotulo: 'Ver clientes', icone: Users },
        { href: '/apolices', rotulo: 'Ver apólices', icone: FileCheck },
        ...((resumo.contagem?.pagamentosRegistrados ?? 0) > 0
            ? [{ href: '/pagamentos', rotulo: 'Ver pagamentos', icone: Wallet }]
            : []),
    ];

    return (
        <div className="flex animate-in flex-col gap-5 duration-300 fade-in slide-in-from-bottom-2">
            {/* Destaque de sucesso */}
            <div className="relative overflow-hidden rounded-2xl border border-emerald-500/25 bg-gradient-to-br from-emerald-500/[0.12] via-emerald-500/[0.04] to-transparent px-5 py-8 text-center">
                <div className="pointer-events-none absolute -top-16 left-1/2 h-40 w-40 -translate-x-1/2 rounded-full bg-emerald-400/20 blur-3xl" />
                <span className="relative mx-auto flex h-16 w-16 animate-in items-center justify-center rounded-full bg-emerald-500 text-white shadow-xl shadow-emerald-500/30 duration-500 zoom-in-50">
                    <CircleCheck className="size-8" />
                </span>
                <p className="relative mt-4 text-xl font-bold tracking-tight text-foreground">
                    Importação concluída
                </p>
                <p className="relative mt-1 text-sm text-muted-foreground">
                    {plural(
                        resumo.importados,
                        'linha importada',
                        'linhas importadas',
                    )}{' '}
                    de {resumo.total.toLocaleString('pt-BR')}
                    {resumo.arquivo && (
                        <>
                            {' '}
                            de{' '}
                            <span className="font-semibold text-foreground">
                                {resumo.arquivo}
                            </span>
                        </>
                    )}
                </p>
            </div>

            {resumo.contagem && (
                <section>
                    <h3 className="mb-2.5 text-[11px] font-bold tracking-[0.12em] text-muted-foreground uppercase">
                        O que foi feito
                    </h3>
                    <GradeAcoes contagem={resumo.contagem} />
                </section>
            )}

            <Faltantes resumo={resumo} isAdmin={isAdmin} />

            <Mensagens
                erros={resumo.erros ?? []}
                totalErros={resumo.totalErros ?? 0}
                avisos={resumo.avisos ?? []}
                totalAvisos={resumo.totalAvisos ?? 0}
                rotuloErros="Ficaram de fora"
                nomeArquivo={resumo.arquivo}
            />

            {/* Próximos passos */}
            <div className="flex flex-col gap-3 border-t border-border/70 pt-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap gap-2">
                    {atalhos.map(({ href, rotulo, icone: Icone }) => (
                        <Link
                            key={href}
                            href={href}
                            className="group inline-flex h-10 items-center gap-1.5 rounded-xl border border-border/70 bg-background px-3 text-xs font-semibold text-foreground transition-all hover:border-emerald-500/40 hover:bg-emerald-500/[0.04]"
                        >
                            <Icone className="size-4 text-emerald-600" />
                            {rotulo}
                            <ArrowRight className="size-3.5 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                        </Link>
                    ))}
                </div>
                <Button
                    onClick={onNovo}
                    className="h-11 rounded-xl bg-emerald-500 px-6 font-bold text-white shadow-lg shadow-emerald-500/20 hover:bg-emerald-600"
                >
                    <Upload className="mr-2 size-4" />
                    Importar outra planilha
                </Button>
            </div>
        </div>
    );
}
