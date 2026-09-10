import { Form, Head } from '@inertiajs/react';
import AuthHeader from '@/components/auth-header';
import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { login } from '@/routes';
import { email } from '@/routes/password';

export default function ForgotPassword({ status }: { status?: string }) {
    return (
        <>
            <Head title="Esqueci minha senha" />
            <div className="mx-auto w-full max-w-sm lg:max-w-none">
                <AuthHeader
                    title="Esqueceu sua senha?"
                    description="Informe seu e-mail e enviaremos um link para redefinir sua senha."
                />

                {status && (
                    <div className="mb-6 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm font-medium text-emerald-600">
                        {status}
                    </div>
                )}

                <Form {...email.form()} className="space-y-5">
                    {({ processing, errors }) => (
                        <>
                            <div className="space-y-2">
                                <Label
                                    htmlFor="email"
                                    className="text-xs font-semibold tracking-wider text-muted-foreground uppercase"
                                >
                                    E-mail
                                </Label>
                                <Input
                                    id="email"
                                    type="email"
                                    name="email"
                                    autoComplete="off"
                                    autoFocus
                                    className="h-12 rounded-xl border-muted-foreground/20 focus:ring-emerald-500"
                                    placeholder="exemplo@payflow.com"
                                />
                                <InputError message={errors.email} />
                            </div>

                            <Button
                                type="submit"
                                className="h-12 w-full rounded-xl bg-emerald-500 font-bold text-white shadow-lg shadow-emerald-500/20 transition-all hover:bg-emerald-600 active:scale-[0.98]"
                                disabled={processing}
                                data-test="email-password-reset-link-button"
                            >
                                {processing && (
                                    <Spinner className="mr-2 h-4 w-4" />
                                )}
                                Enviar link de redefinição
                            </Button>

                            <div className="mt-8 text-center text-sm text-muted-foreground">
                                Lembrou a senha?{' '}
                                <TextLink
                                    href={login()}
                                    className="font-bold text-emerald-600 hover:text-emerald-500"
                                >
                                    Voltar ao login
                                </TextLink>
                            </div>
                        </>
                    )}
                </Form>
            </div>
        </>
    );
}
