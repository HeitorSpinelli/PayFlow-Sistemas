import { Form, Head } from '@inertiajs/react';
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
import React from 'react';
import { UserRound } from 'lucide-react';

export default function Login({ status, canResetPassword, canRegister }: any) {
    return (
        <>
            <Head title="Log in" />
            <div className="mx-auto w-full max-w-sm lg:max-w-none">
                        
                        {/* Header do Form */}
                        <div className="mb-10">
                            <div className="flex items-center gap-2 mb-6">
                                <div className="h-8 w-8 bg-emerald-500 rounded-lg flex items-center justify-center shadow-lg shadow-emerald-500/20">
                                    <div className="h-4 w-4 border-2 border-white rounded-sm rotate-45"></div>
                                </div>
                                <span className="text-sm font-black tracking-tighter text-emerald-600 uppercase italic">
                                    PayFlow-Sistemas
                                </span>
                            </div>
                            <h1 className="text-3xl font-bold tracking-tight text-[#1b1b18] dark:text-white">Bem-vindo de volta</h1>
                            <p className="mt-2 text-sm text-muted-foreground">Insira suas credenciais para acessar sua conta.</p>
                        </div>

                        {status && (
                            <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 text-sm font-medium text-emerald-600 border border-emerald-500/20">
                                {status}
                            </div>
                        )}

                        <Form {...store.form()} resetOnSuccess={['password']} className="space-y-5">
                            {({ processing, errors }) => (
                                <>
                                    <div className="space-y-2">
                                        <Label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">E-mail</Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            name="email"
                                            className="h-12 border-muted-foreground/20 focus:ring-emerald-500 rounded-xl"
                                            required
                                            placeholder="exemplo@payflow.com"
                                        />
                                        <InputError message={errors.email} />
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <Label htmlFor="password" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Senha</Label>
                                            {canResetPassword && (
                                                <TextLink href={request()} className="text-xs font-bold text-emerald-600 hover:underline">
                                                    Esqueceu?
                                                </TextLink>
                                            )}
                                        </div>
                                        <PasswordInput
                                            id="password"
                                            name="password"
                                            className="h-12 border-muted-foreground/20 focus:ring-emerald-500 rounded-xl"
                                            required
                                            placeholder="••••••••"
                                        />
                                        <InputError message={errors.password} />
                                    </div>

                                    <div className="flex items-center space-x-2">
                                        <Checkbox id="remember" name="remember" className="rounded-md border-muted-foreground/30 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500" />
                                        <Label htmlFor="remember" className="text-sm font-medium leading-none cursor-pointer">Lembrar de mim</Label>
                                    </div>

                                    <Button
                                        type="submit"
                                        className="h-12 w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20 transition-all active:scale-[0.98]"
                                        disabled={processing}
                                    >
                            {processing && <Spinner className="mr-2 h-4 w-4" />}
                                Entrar no Sistema
                                </Button>
                            {canRegister && (
                                <div className="mt-8 text-center text-sm text-muted-foreground">
                                        Não tem uma conta?{' '}
                                    <TextLink href={register()} className="font-bold text-emerald-600 hover:text-emerald-500">
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