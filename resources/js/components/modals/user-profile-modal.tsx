import { router } from '@inertiajs/react';
import { ChevronRight, Mail, Shield, UserRound } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

function Section({ icon, title, description, children }: any) {
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

function InfoField({ label, value }: { label: string; value?: string }) {
    return (
        <div className="rounded-xl border border-border/70 bg-background px-3 py-2.5 shadow-sm">
            <p className="mb-1 text-[10px] font-bold tracking-[0.14em] text-muted-foreground uppercase">
                {label}
            </p>
            <p className="text-sm font-semibold text-foreground">
                {value || 'Não informado'}
            </p>
        </div>
    );
}

interface User {
    id: number;
    name: string;
    email: string;
    role: string;
    created_at?: string;
}

interface Props {
    open: boolean;
    setOpen: (open: boolean) => void;
    user: User | null;
}

export default function UserProfileModal({ open, setOpen, user }: Props) {
    const [novoCargo, setNovoCargo] = useState(user?.role ?? 'user');
    const [processing, setProcessing] = useState(false);

    // Sempre que o usuário selecionado mudar, reseta o valor do select
    // para o cargo atual dele (evita "vazar" a seleção de um modal pro outro)
    useEffect(() => {
        setNovoCargo(user?.role ?? 'user');
    }, [user]);

    const fechar = () => {
        setOpen(false);
    };

    const salvarCargo = () => {
        if (!user) return;

        setProcessing(true);
        router.put(
            `/administracao/usuarios/${user.id}`,
            { role: novoCargo },
            {
                onSuccess: () => {
                    fechar();
                },
                onFinish: () => setProcessing(false),
            },
        );
    };

    return (
        <Dialog open={open} onOpenChange={fechar}>
            <DialogContent className="!flex max-h-[92vh] max-w-2xl flex-col gap-0 overflow-hidden rounded-2xl border-border/70 p-0 shadow-2xl">
                <DialogHeader className="relative shrink-0 overflow-hidden border-b border-border/70 bg-gradient-to-br from-emerald-500/[0.12] via-background to-background px-6 py-6 pr-12 sm:px-8">
                    <div className="absolute -top-12 -right-10 h-36 w-36 rounded-full bg-emerald-500/10 blur-2xl" />
                    <div className="relative flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-lg shadow-emerald-500/25">
                            <span className="text-lg font-bold">
                                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                            </span>
                        </div>
                        <div>
                            <div className="mb-1 flex items-center gap-1.5 text-[10px] font-bold tracking-[0.16em] text-emerald-600 uppercase">
                                <span>Usuários</span>
                                <ChevronRight className="h-3 w-3" />
                                <span>Perfil</span>
                            </div>
                            <DialogTitle className="text-xl font-bold tracking-tight sm:text-2xl">
                                {user?.name}
                            </DialogTitle>
                        </div>
                    </div>
                </DialogHeader>

                <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-6 py-6 sm:px-8">
                    <Section
                        icon={<UserRound className="h-4 w-4" />}
                        title="Dados do usuário"
                        description="Identificação"
                    >
                        <div className="grid gap-3 sm:grid-cols-2">
                            <InfoField label="Nome" value={user?.name} />
                            <InfoField label="Email" value={user?.email} />
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
                                value={novoCargo}
                                onValueChange={setNovoCargo}
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
                            <p className="text-xs text-muted-foreground">
                                Usuários com cargo <strong>Admin</strong> têm
                                acesso a seguradoras, notificações, automações e
                                administração do sistema.
                            </p>
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
                        onClick={salvarCargo}
                        disabled={processing || novoCargo === user?.role}
                    >
                        {processing ? 'Salvando...' : 'Salvar alterações'}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
