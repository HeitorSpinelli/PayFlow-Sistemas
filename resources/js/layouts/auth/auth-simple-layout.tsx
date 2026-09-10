import type { AuthLayoutProps } from '@/types';

export default function AuthSimpleLayout({
    children,
    title,
    description,
}: AuthLayoutProps) {
    return (
        <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-background p-6 md:p-10">
            <div className="w-full max-w-sm">
                <div className="flex flex-col gap-8">
                    {/* Só renderiza esse cabeçalho genérico se a página não trouxer
                        o seu próprio (via <AuthHeader />, com a marca do PayFlow) —
                        sem essa checagem, ficava um <h1>/<p> vazios acima dele. */}
                    {title && (
                        <div className="flex flex-col items-center gap-4">
                            <div className="space-y-2 text-center">
                                <h1 className="text-xl font-medium">{title}</h1>
                                <p className="text-center text-sm text-muted-foreground">
                                    {description}
                                </p>
                            </div>
                        </div>
                    )}
                    {children}
                </div>
            </div>
        </div>
    );
}
