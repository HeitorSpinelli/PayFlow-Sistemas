// Compartilhado entre os modais de criar/editar segurado (e reaproveitável
// pelos de apólice) — antes cada modal tinha sua própria cópia de Section e
// InfoField, o que já causou divergência de estilo entre eles.
export function Section({
    icon,
    title,
    description,
    children,
}: {
    icon: React.ReactNode;
    title: string;
    description?: string;
    children: React.ReactNode;
}) {
    return (
        <section className="rounded-xl border border-border/60 p-4 sm:p-5">
            <div className="mb-4 flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600">
                    {icon}
                </span>
                <div>
                    <h3 className="text-sm font-semibold">{title}</h3>
                    {description && (
                        <p className="text-xs text-muted-foreground">
                            {description}
                        </p>
                    )}
                </div>
            </div>
            {children}
        </section>
    );
}

export function InfoField({
    label,
    value,
}: {
    label: string;
    value?: string | number | null;
}) {
    return (
        <div className="rounded-lg border border-border/60 px-3 py-2.5">
            <p className="mb-1 text-[10px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
                {label}
            </p>
            <p className="text-sm font-medium text-foreground">
                {value || 'Não informado'}
            </p>
        </div>
    );
}
