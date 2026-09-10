import { Form, Head } from '@inertiajs/react';
import AuthHeader from '@/components/auth-header';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { logout } from '@/routes';
import { send } from '@/routes/verification';

export default function VerifyEmail({ status }: { status?: string }) {
    return (
        <>
            <Head title="Verificar e-mail" />
            <div className="mx-auto w-full max-w-sm lg:max-w-none">
                <AuthHeader
                    title="Verifique seu e-mail"
                    description="Enviamos um link de confirmação para o e-mail informado no cadastro. Clique nele para ativar sua conta."
                />

                {status === 'verification-link-sent' && (
                    <div className="mb-6 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm font-medium text-emerald-600">
                        Um novo link de verificação foi enviado para o e-mail
                        informado no cadastro.
                    </div>
                )}

                <Form {...send.form()} className="space-y-5">
                    {({ processing }) => (
                        <>
                            <Button
                                type="submit"
                                className="h-12 w-full rounded-xl bg-emerald-500 font-bold text-white shadow-lg shadow-emerald-500/20 transition-all hover:bg-emerald-600 active:scale-[0.98]"
                                disabled={processing}
                            >
                                {processing && (
                                    <Spinner className="mr-2 h-4 w-4" />
                                )}
                                Reenviar e-mail de verificação
                            </Button>

                            <div className="text-center text-sm text-muted-foreground">
                                <TextLink
                                    href={logout()}
                                    className="font-bold text-emerald-600 hover:text-emerald-500"
                                >
                                    Sair da conta
                                </TextLink>
                            </div>
                        </>
                    )}
                </Form>
            </div>
        </>
    );
}
