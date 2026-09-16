import { useForm } from '@inertiajs/react';
import { ChevronRight, KeyRound, Shield, UserRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

function Section({
    icon,
    title,
    description,
    children,
}: {
    icon: React.ReactNode;
    title: string;
    description: string;
    children: React.ReactNode;
}) {
    return (
        <section className="rounded-2xl border border-border/70 bg-muted/[0.18] p-4 sm:p-5">
            <div className="mb-5 flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
                    {icon}
                </span>
                <div>
                    <h3 className="text-sm font-bold">{title}</h3>
                    <p className="text-xs text-muted-foreground">
                        {description}
                    </p>
                </div>
            </div>
            {children}
        </section>
    );
}

interface Props {
    open: boolean;
    setOpen: (open: boolean) => void;
}

export default function CreateUsuarioModal({ open, setOpen }: Props) {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        role: 'user',
    });

    const fechar = () => {
        reset();
        setOpen(false);
    };

    // O toast de sucesso já vem do listener global de flash message no
    // layout — não duplicamos aqui.
    const salvar = () => {
        post('/administracao/usuarios', {
            onSuccess: () => fechar(),
        });
    };

    return (
        <Dialog
            open={open}
            onOpenChange={(v) => (v ? setOpen(true) : fechar())}
        >
            <DialogContent className="!flex max-h-[92vh] max-w-2xl flex-col gap-0 overflow-hidden rounded-2xl border-border/70 p-0 shadow-2xl">
                <DialogHeader className="relative shrink-0 overflow-hidden border-b border-border/70 bg-gradient-to-br from-emerald-500/[0.12] via-background to-background px-6 py-6 pr-12 sm:px-8">
                    <div className="absolute -top-12 -right-10 h-36 w-36 rounded-full bg-emerald-500/10 blur-2xl" />
                    <div className="relative flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-lg shadow-emerald-500/25">
                            <UserRound className="size-5" />
                        </div>
                        <div>
                            <div className="mb-1 flex items-center gap-1.5 text-[10px] font-bold tracking-[0.16em] text-emerald-600 uppercase">
                                <span>Usuários</span>
                                <ChevronRight className="h-3 w-3" />
                                <span>Novo</span>
                            </div>
                            <DialogTitle className="text-xl font-bold tracking-tight sm:text-2xl">
                                Cadastrar usuário
                            </DialogTitle>
                        </div>
                    </div>
                </DialogHeader>

                <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-6 py-6 sm:px-8">
                    <Section
                        icon={<UserRound className="h-4 w-4" />}
                        title="Dados do usuário"
                        description="Nome e e-mail de acesso"
                    >
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm leading-none font-medium">
                                    Nome
                                </label>
                                <Input
                                    className="h-10 rounded-xl border border-border/70 bg-background px-3 py-2 text-sm shadow-sm transition-all hover:border-emerald-500/40 focus-visible:ring-4 focus-visible:ring-emerald-500/10 focus-visible:outline-none"
                                    value={data.name}
                                    onChange={(e) =>
                                        setData('name', e.target.value)
                                    }
                                />
                                {errors.name && (
                                    <span className="text-xs font-medium text-rose-500">
                                        {errors.name}
                                    </span>
                                )}
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm leading-none font-medium">
                                    E-mail
                                </label>
                                <Input
                                    type="email"
                                    className="h-10 rounded-xl border border-border/70 bg-background px-3 py-2 text-sm shadow-sm transition-all hover:border-emerald-500/40 focus-visible:ring-4 focus-visible:ring-emerald-500/10 focus-visible:outline-none"
                                    value={data.email}
                                    onChange={(e) =>
                                        setData('email', e.target.value)
                                    }
                                />
                                {errors.email && (
                                    <span className="text-xs font-medium text-rose-500">
                                        {errors.email}
                                    </span>
                                )}
                            </div>
                        </div>
                    </Section>

                    <Section
                        icon={<KeyRound className="h-4 w-4" />}
                        title="Senha inicial"
                        description="A pessoa pode trocar depois em Configurações"
                    >
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <label className="text-sm leading-none font-medium">
                                    Senha
                                </label>
                                <Input
                                    type="password"
                                    autoComplete="new-password"
                                    className="h-10 rounded-xl border border-border/70 bg-background px-3 py-2 text-sm shadow-sm transition-all hover:border-emerald-500/40 focus-visible:ring-4 focus-visible:ring-emerald-500/10 focus-visible:outline-none"
                                    value={data.password}
                                    onChange={(e) =>
                                        setData('password', e.target.value)
                                    }
                                />
                                {errors.password && (
                                    <span className="text-xs font-medium text-rose-500">
                                        {errors.password}
                                    </span>
                                )}
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm leading-none font-medium">
                                    Confirmar senha
                                </label>
                                <Input
                                    type="password"
                                    autoComplete="new-password"
                                    className="h-10 rounded-xl border border-border/70 bg-background px-3 py-2 text-sm shadow-sm transition-all hover:border-emerald-500/40 focus-visible:ring-4 focus-visible:ring-emerald-500/10 focus-visible:outline-none"
                                    value={data.password_confirmation}
                                    onChange={(e) =>
                                        setData(
                                            'password_confirmation',
                                            e.target.value,
                                        )
                                    }
                                />
                            </div>
                        </div>
                    </Section>

                    <Section
                        icon={<Shield className="h-4 w-4" />}
                        title="Permissões"
                        description="Cargo e nível de acesso do usuário"
                    >
                        <div className="space-y-2">
                            <label className="text-sm leading-none font-medium">
                                Cargo
                            </label>
                            <Select
                                value={data.role}
                                onValueChange={(v) => setData('role', v)}
                            >
                                <SelectTrigger className="h-10 w-full rounded-xl border border-border/70 bg-background px-3 py-2 text-sm shadow-sm transition-all hover:border-emerald-500/40 focus:ring-4 focus:ring-emerald-500/10 focus:outline-none">
                                    <SelectValue placeholder="Selecione o cargo" />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl border border-border/70 bg-popover text-popover-foreground shadow-md">
                                    <SelectItem
                                        value="admin"
                                        className="cursor-pointer rounded-lg"
                                    >
                                        Admin
                                    </SelectItem>
                                    <SelectItem
                                        value="user"
                                        className="cursor-pointer rounded-lg"
                                    >
                                        User
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </Section>
                </div>

                <div className="flex shrink-0 items-center justify-end gap-2 border-t border-border/70 bg-background px-6 py-4 sm:px-8">
                    <Button
                        variant="outline"
                        className="rounded-xl"
                        onClick={fechar}
                    >
                        Cancelar
                    </Button>
                    <Button
                        className="rounded-xl bg-emerald-500 text-white shadow-lg shadow-emerald-500/25 hover:bg-emerald-600"
                        onClick={salvar}
                        disabled={processing}
                    >
                        {processing ? 'Cadastrando...' : 'Cadastrar usuário'}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
