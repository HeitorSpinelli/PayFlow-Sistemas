import type { DocumentoLegal } from './conteudo';

/**
 * Corpo de um documento legal (Termos, Privacidade, Confidencialidade):
 * resumo em destaque e as seções numeradas. Usado na janela de aceite
 * (ModalTermos) e na página /termos.
 */
export default function Documento({
    documento,
}: {
    documento: DocumentoLegal;
}) {
    return (
        <article className="flex flex-col gap-6 text-sm leading-relaxed text-foreground/90">
            <p className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.06] px-4 py-3 text-[13px] text-emerald-900 dark:text-emerald-200">
                {documento.resumo}
            </p>

            {documento.secoes.map((secao) => (
                <section key={secao.titulo} className="flex flex-col gap-2">
                    <h3 className="text-sm font-bold text-foreground">
                        {secao.titulo}
                    </h3>
                    {secao.paragrafos?.map((p) => (
                        <p key={p}>{p}</p>
                    ))}
                    {secao.itens && (
                        <ul className="flex flex-col gap-1.5 pl-1">
                            {secao.itens.map((item) => (
                                <li key={item} className="flex gap-2.5">
                                    <span className="mt-2 size-1.5 shrink-0 rounded-full bg-emerald-500" />
                                    <span>{item}</span>
                                </li>
                            ))}
                        </ul>
                    )}
                    {secao.nota && (
                        <p className="text-[13px] text-muted-foreground italic">
                            {secao.nota}
                        </p>
                    )}
                </section>
            ))}
        </article>
    );
}
