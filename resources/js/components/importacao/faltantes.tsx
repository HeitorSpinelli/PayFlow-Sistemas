import { Link } from '@inertiajs/react';
import { Building2, ChevronRight } from 'lucide-react';
import type { Resumo } from './tipos';

/**
 * Seguradoras e ramos que a planilha usa mas não estão cadastrados. Admin
 * ganha o atalho para cadastrar (a tela Seguradoras abre o cadastro já com
 * o nome via ?nova_seguradora=).
 */
export default function Faltantes({
    resumo,
    isAdmin,
}: {
    resumo: Resumo;
    isAdmin: boolean;
}) {
    const seguradoras = resumo.seguradorasFaltantes ?? [];
    const ramos = resumo.ramosFaltantes ?? [];

    if (seguradoras.length === 0 && ramos.length === 0) {
        return null;
    }

    const itens = [
        ...seguradoras.map((nome) => ({
            chave: `s-${nome}`,
            texto: (
                <>
                    Seguradora <strong className="font-semibold">{nome}</strong>
                </>
            ),
            href: `/seguradoras?nova_seguradora=${encodeURIComponent(nome)}`,
            acao: 'Cadastrar',
        })),
        ...ramos.map((r) => ({
            chave: `r-${r.seguradora}-${r.ramo}`,
            texto: (
                <>
                    Ramo <strong className="font-semibold">{r.ramo}</strong> na{' '}
                    {r.seguradora}
                </>
            ),
            href: '/seguradoras',
            acao: 'Abrir',
        })),
    ];

    return (
        <div className="rounded-2xl border border-amber-500/25 bg-amber-500/[0.06] p-4">
            <div className="mb-3 flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-600">
                    <Building2 className="size-4" />
                </span>
                <div>
                    <p className="text-sm font-bold text-foreground">
                        Falta cadastrar no sistema
                    </p>
                    <p className="text-xs text-muted-foreground">
                        {isAdmin
                            ? 'Cadastre e depois envie a mesma planilha de novo.'
                            : 'Peça a um administrador para cadastrar em Seguradoras e Ramos e envie a planilha de novo.'}
                    </p>
                </div>
            </div>

            <ul className="flex flex-col gap-2">
                {itens.map((item) => (
                    <li
                        key={item.chave}
                        className="flex items-center justify-between gap-3 rounded-xl border border-border/70 bg-background px-3 py-2 text-sm"
                    >
                        <span className="min-w-0 truncate">{item.texto}</span>
                        {isAdmin && (
                            <Link
                                href={item.href}
                                className="inline-flex h-9 shrink-0 items-center gap-1 rounded-lg px-3 text-xs font-bold text-emerald-600 transition-colors hover:bg-emerald-500/10"
                            >
                                {item.acao}
                                <ChevronRight className="size-3.5" />
                            </Link>
                        )}
                    </li>
                ))}
            </ul>
        </div>
    );
}
