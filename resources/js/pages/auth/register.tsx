import { Form, Head } from '@inertiajs/react';
import AuthHeader from '@/components/auth-header';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { login } from '@/routes';
import { store } from '@/routes/register';

export default function Register() {
    return (
        <>
            <Head title="Criar conta" />

            <div className="mx-auto w-full max-w-sm lg:max-w-none">
                <AuthHeader
                    title="Criar conta"
                    description="Preencha os dados para criar sua conta."
                />

                <Form
                    {...store.form()}
                    resetOnSuccess={['password', 'password_confirmation']}
                    className="space-y-5"
                >
                    {({ processing, errors }) => (
                        <>
                            {/* Nome */}
                            <div className="space-y-2">
                                <Label className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                    Nome
                                </Label>
                                <Input
                                    name="name"
                                    className="h-12 rounded-xl border-muted-foreground/20 focus:ring-emerald-500"
                                    required
                                    placeholder="Seu nome completo"
                                />
                                <InputError message={errors.name} />
                            </div>

                            {/* Email */}
                            <div className="space-y-2">
                                <Label className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                    E-mail
                                </Label>
                                <Input
                                    type="email"
                                    name="email"
                                    className="h-12 rounded-xl border-muted-foreground/20 focus:ring-emerald-500"
                                    required
                                    placeholder="exemplo@payflow.com"
                                />
                                <InputError message={errors.email} />
                            </div>

                            {/* Senha */}
                            <div className="space-y-2">
                                <Label className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                    Senha
                                </Label>
                                <PasswordInput
                                    name="password"
                                    className="h-12 rounded-xl border-muted-foreground/20 focus:ring-emerald-500"
                                    required
                                    placeholder="••••••••"
                                />
                                <InputError message={errors.password} />
                            </div>

                            {/* Confirmar senha */}
                            <div className="space-y-2">
                                <Label className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                    Confirmar senha
                                </Label>
                                <PasswordInput
                                    name="password_confirmation"
                                    className="h-12 rounded-xl border-muted-foreground/20 focus:ring-emerald-500"
                                    required
                                    placeholder="••••••••"
                                />
                                <InputError
                                    message={errors.password_confirmation}
                                />
                            </div>

                            {/* Botão */}
                            <Button
                                type="submit"
                                className="h-12 w-full rounded-xl bg-emerald-500 font-bold text-white shadow-lg shadow-emerald-500/20 transition-all hover:bg-emerald-600 active:scale-[0.98]"
                                disabled={processing}
                            >
                                {processing && (
                                    <Spinner className="mr-2 h-4 w-4" />
                                )}
                                Criar conta
                            </Button>

                            {/* Link login */}
                            <div className="mt-8 text-center text-sm text-muted-foreground">
                                Já tem uma conta?{' '}
                                <TextLink
                                    href={login()}
                                    className="font-bold text-emerald-600 hover:text-emerald-500"
                                >
                                    Entrar
                                </TextLink>
                            </div>
                        </>
                    )}
                </Form>
            </div>
        </>
    );
}
