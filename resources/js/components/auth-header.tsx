export default function AuthHeader({
    title,
    description,
}: {
    title: string;
    description?: string;
}) {
    return (
        <div className="mb-10">
            <div className="mb-6 flex items-center gap-2">
                <img
                    src="/logo.svg"
                    alt="Logo PayFlow"
                    className="h-8 w-8 object-contain"
                />
                <span className="text-sm font-black tracking-tighter text-emerald-600 uppercase italic">
                    PayFlow-Sistemas
                </span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-[#1b1b18] dark:text-white">
                {title}
            </h1>
            {description && (
                <p className="mt-2 text-sm text-muted-foreground">
                    {description}
                </p>
            )}
        </div>
    );
}
