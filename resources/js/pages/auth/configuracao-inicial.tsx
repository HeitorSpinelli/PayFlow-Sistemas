import { Head, useForm } from '@inertiajs/react';
import AuthHeader from '@/components/auth-header';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';

export default function ConfiguracaoInicial() {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
    });

    const enviar = (e: React.FormEvent) => {
        e.preventDefault();
        post('/configuracao-inicial');
    };

    return (
        <>
            <Head title="Configuração inicial" />
            <div className="mx-auto w-full max-w-sm lg:max-w-none">
                <AuthHeader
                    title="Configuração inicial"
                    description="Este sistema ainda não tem nenhum administrador. Crie a primeira conta para começar a usar o PayFlow."
                />

                <form onSubmit={enviar} className="space-y-5">
                    <div className="space-y-2">
                        <Label
                            htmlFor="name"
                            className="text-xs font-semibold tracking-wider text-muted-foreground uppercase"
                        >
                            Nome
                        </Label>
                        <Input
                            id="name"
                            name="name"
                            className="h-12 rounded-xl border-muted-foreground/20 focus:ring-emerald-500"
                            required
                            autoComplete="name"
                            placeholder="Seu nome completo"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                        />
                        <InputError message={errors.name} />
                    </div>

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
                            autoComplete="username"
                            placeholder="exemplo@payflow.com"
                            value={data.email}
                            onChange={(e) => setData('email', e.target.value)}
                        />
                        <InputError message={errors.email} />
                    </div>

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
                            className="h-12 rounded-xl border-muted-foreground/20 focus:ring-emerald-500"
                            required
                            autoComplete="new-password"
                            placeholder="••••••••"
                            value={data.password}
                            onChange={(
                                e: React.ChangeEvent<HTMLInputElement>,
                            ) => setData('password', e.target.value)}
                        />
                        <InputError message={errors.password} />
                    </div>

                    <div className="space-y-2">
                        <Label
                            htmlFor="password_confirmation"
                            className="text-xs font-semibold tracking-wider text-muted-foreground uppercase"
                        >
                            Confirmar senha
                        </Label>
                        <PasswordInput
                            id="password_confirmation"
                            name="password_confirmation"
                            className="h-12 rounded-xl border-muted-foreground/20 focus:ring-emerald-500"
                            required
                            autoComplete="new-password"
                            placeholder="••••••••"
                            value={data.password_confirmation}
                            onChange={(
                                e: React.ChangeEvent<HTMLInputElement>,
                            ) =>
                                setData('password_confirmation', e.target.value)
                            }
                        />
                        <InputError message={errors.password_confirmation} />
                    </div>

                    <Button
                        type="submit"
                        className="h-12 w-full rounded-xl bg-emerald-500 font-bold text-white shadow-lg shadow-emerald-500/20 transition-all hover:bg-emerald-600 active:scale-[0.98]"
                        disabled={processing}
                    >
                        {processing && <Spinner className="mr-2 h-4 w-4" />}
                        Criar administrador
                    </Button>
                </form>
            </div>
        </>
    );
}
