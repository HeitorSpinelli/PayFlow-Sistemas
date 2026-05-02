import { Form, Head } from '@inertiajs/react';
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
            <Head title="Register" />

            <div className="mx-auto w-full max-w-sm lg:max-w-none">

                {/* Header */}
                <div className="mb-10">
                    <div className="flex items-center gap-2 mb-6">
                        <div className="h-8 w-8 bg-emerald-500 rounded-lg flex items-center justify-center shadow-lg shadow-emerald-500/20">
                            <div className="h-4 w-4 border-2 border-white rounded-sm rotate-45"></div>
                        </div>
                        <span className="text-sm font-black tracking-tighter text-emerald-600 uppercase italic">
                            PayFlow-Sistemas
                        </span>
                    </div>

                    <h1 className="text-3xl font-bold tracking-tight text-[#1b1b18] dark:text-white">
                        Criar conta
                    </h1>
                    <p className="mt-2 text-sm text-muted-foreground">
                        Preencha os dados para criar sua conta.
                    </p>
                </div>

                <Form
                    {...store.form()}
                    resetOnSuccess={['password', 'password_confirmation']}
                    className="space-y-5"
                >
                    {({ processing, errors }) => (
                        <>
                            {/* Nome */}
                            <div className="space-y-2">
                                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                    Nome
                                </Label>
                                <Input
                                    name="name"
                                    className="h-12 border-muted-foreground/20 focus:ring-emerald-500 rounded-xl"
                                    required
                                    placeholder="Seu nome completo"
                                />
                                <InputError message={errors.name} />
                            </div>

                            {/* Email */}
                            <div className="space-y-2">
                                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                    E-mail
                                </Label>
                                <Input
                                    type="email"
                                    name="email"
                                    className="h-12 border-muted-foreground/20 focus:ring-emerald-500 rounded-xl"
                                    required
                                    placeholder="exemplo@payflow.com"
                                />
                                <InputError message={errors.email} />
                            </div>

                            {/* Senha */}
                            <div className="space-y-2">
                                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                    Senha
                                </Label>
                                <PasswordInput
                                    name="password"
                                    className="h-12 border-muted-foreground/20 focus:ring-emerald-500 rounded-xl"
                                    required
                                    placeholder="••••••••"
                                />
                                <InputError message={errors.password} />
                            </div>

                            {/* Confirmar senha */}
                            <div className="space-y-2">
                                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                    Confirmar senha
                                </Label>
                                <PasswordInput
                                    name="password_confirmation"
                                    className="h-12 border-muted-foreground/20 focus:ring-emerald-500 rounded-xl"
                                    required
                                    placeholder="••••••••"
                                />
                                <InputError message={errors.password_confirmation} />
                            </div>

                            {/* Botão */}
                            <Button
                                type="submit"
                                className="h-12 w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20 transition-all active:scale-[0.98]"
                                disabled={processing}
                            >
                                {processing && <Spinner className="mr-2 h-4 w-4" />}
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