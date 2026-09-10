import { Form, Head } from '@inertiajs/react';
import AuthHeader from '@/components/auth-header';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { register } from '@/routes';
import { store } from '@/routes/login';
import { request } from '@/routes/password';

export default function Login({ status, canResetPassword, canRegister }: any) {
    return (
        <>
            <Head title="Entrar" />
            <div className="mx-auto w-full max-w-sm lg:max-w-none">
                <AuthHeader
                    title="Bem-vindo de volta"
                    description="Insira suas credenciais para acessar sua conta."
                />

                {status && (
                    <div className="mb-6 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm font-medium text-emerald-600">
                        {status}
                    </div>
                )}

                <Form
                    {...store.form()}
                    resetOnSuccess={['password']}
                    className="space-y-5"
                >
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
                                    className="h-12 rounded-xl border-muted-foreground/20 focus:ring-emerald-500"
                                    required
                                    placeholder="exemplo@payflow.com"
                                />
                                <InputError message={errors.email} />
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label
                                        htmlFor="password"
                                        className="text-xs font-semibold tracking-wider text-muted-foreground uppercase"
                                    >
                                        Senha
                                    </Label>
                                    {canResetPassword && (
                                        <TextLink
                                            href={request()}
                                            className="text-xs font-bold text-emerald-600 hover:underline"
                                        >
                                            Esqueceu?
                                        </TextLink>
                                    )}
                                </div>
                                <PasswordInput
                                    id="password"
                                    name="password"
                                    className="h-12 rounded-xl border-muted-foreground/20 focus:ring-emerald-500"
                                    required
                                    placeholder="••••••••"
                                />
                                <InputError message={errors.password} />
                            </div>

                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="remember"
                                    name="remember"
                                    className="rounded-md border-muted-foreground/30 data-[state=checked]:border-emerald-500 data-[state=checked]:bg-emerald-500"
                                />
                                <Label
                                    htmlFor="remember"
                                    className="cursor-pointer text-sm leading-none font-medium"
                                >
                                    Lembrar de mim
                                </Label>
                            </div>

                            <Button
                                type="submit"
                                className="h-12 w-full rounded-xl bg-emerald-500 font-bold text-white shadow-lg shadow-emerald-500/20 transition-all hover:bg-emerald-600 active:scale-[0.98]"
                                disabled={processing}
                            >
                                {processing && (
                                    <Spinner className="mr-2 h-4 w-4" />
                                )}
                                Entrar no Sistema
                            </Button>
                            {canRegister && (
                                <div className="mt-8 text-center text-sm text-muted-foreground">
                                    Não tem uma conta?{' '}
                                    <TextLink
                                        href={register()}
                                        className="font-bold text-emerald-600 hover:text-emerald-500"
                                    >
                                        Cadastre-se agora
                                    </TextLink>
                                </div>
                            )}
                        </>
                    )}
                </Form>
            </div>
        </>
    );
}
