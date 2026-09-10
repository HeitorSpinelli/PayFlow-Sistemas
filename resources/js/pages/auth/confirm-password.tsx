import { Form, Head } from '@inertiajs/react';
import AuthHeader from '@/components/auth-header';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { store } from '@/routes/password/confirm';

export default function ConfirmPassword() {
    return (
        <>
            <Head title="Confirmar senha" />
            <div className="mx-auto w-full max-w-sm lg:max-w-none">
                <AuthHeader
                    title="Área protegida"
                    description="Confirme sua senha antes de continuar — essa é uma área sensível do sistema."
                />

                <Form
                    {...store.form()}
                    resetOnSuccess={['password']}
                    className="space-y-5"
                >
                    {({ processing, errors }) => (
                        <>
                            <div className="space-y-2">
                                <Label
                                    htmlFor="password"
                                    className="text-xs font-semibold tracking-wider text-muted-foreground uppercase"
                                >
                                    Senha
                                </Label>
                                <PasswordInput
                                    id="password"
                                    name="password"
                                    placeholder="••••••••"
                                    autoComplete="current-password"
                                    autoFocus
                                    className="h-12 rounded-xl border-muted-foreground/20 focus:ring-emerald-500"
                                />
                                <InputError message={errors.password} />
                            </div>

                            <Button
                                type="submit"
                                className="h-12 w-full rounded-xl bg-emerald-500 font-bold text-white shadow-lg shadow-emerald-500/20 transition-all hover:bg-emerald-600 active:scale-[0.98]"
                                disabled={processing}
                                data-test="confirm-password-button"
                            >
                                {processing && (
                                    <Spinner className="mr-2 h-4 w-4" />
                                )}
                                Confirmar
                            </Button>
                        </>
                    )}
                </Form>
            </div>
        </>
    );
}
