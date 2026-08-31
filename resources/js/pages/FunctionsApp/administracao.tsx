import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { router } from '@inertiajs/react';
import { toast } from 'sonner';
import { RotateCcw } from 'lucide-react';
import { useState } from 'react';
import UserProfileModal from '@/components/modals/user-profile-modal';

interface User {
    id: number;
    name: string;
    email: string;
    role: string;
    created_at?: string;
}

interface SeguradoInativo {
    id: number;
    nome_completo: string;
    cpf_cnpj: string;
    email: string;
    deleted_at: string;
}

interface Props {
    users: User[];
    inativos: SeguradoInativo[];
}

export default function Administracao({ users, inativos }: Props) {
    const [openPerfil, setOpenPerfil] = useState(false);
    const [usuarioSelecionado, setUsuarioSelecionado] = useState<User | null>(
        null,
    );

    const abrirPerfil = (user: User) => {
        setUsuarioSelecionado(user);
        setOpenPerfil(true);
    };

    const restaurarSegurado = (id: number) => {
        router.patch(
            `/clientes/restaurar/${id}`,
            {},
            {
                onSuccess: () => {
                    toast.success('Cliente restaurado com sucesso!', {
                        position: 'top-right',
                    });
                },
                onError: () => {
                    toast.error('Erro ao restaurar cliente.', {
                        position: 'top-right',
                    });
                },
            },
        );
    };
    return (
        <div className="min-h-screen space-y-6 bg-background p-6 sm:p-8">
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                Administração do Sistema
            </h1>

            <Tabs defaultValue="users" className="w-full">
                <TabsList className="grid w-full max-w-md grid-cols-3">
                    <TabsTrigger value="users">Usuários</TabsTrigger>
                    <TabsTrigger value="clientes">
                        Clientes Inativos
                    </TabsTrigger>
                    <TabsTrigger value="sistema">Sistema</TabsTrigger>
                </TabsList>

                <TabsContent value="users" className="space-y-6">
                    {/* Cabeçalho da Seção */}
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h2 className="text-xl font-bold tracking-tight">
                                Usuários do Sistema
                            </h2>
                            <p className="text-sm text-muted-foreground">
                                Gerencie os usuários e suas permissões
                            </p>
                        </div>
                        <button className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-emerald-500">
                            + Novo Usuário
                        </button>
                    </div>

                    {/* Tabela de Usuários */}
                    <div className="overflow-hidden rounded-2xl border border-border/70 bg-background shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse text-left">
                                <thead>
                                    <tr className="border-b border-border/70 bg-muted/30 text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
                                        <th className="p-4 pl-6">Usuário</th>
                                        <th className="p-4">Cargo</th>
                                        <th className="p-4">Status</th>
                                        <th className="p-4 pr-6 text-right">
                                            Ações
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/70 text-sm">
                                    {users?.map((user) => (
                                        <tr
                                            key={user.id}
                                            className="transition-colors hover:bg-muted/30"
                                        >
                                            <td className="flex items-center gap-3 p-4 pl-6">
                                                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500/10 text-xs font-bold text-emerald-600">
                                                    {user.name
                                                        .substring(0, 2)
                                                        .toUpperCase()}
                                                </span>
                                                <div>
                                                    <p className="leading-none font-semibold text-foreground">
                                                        {user.name}
                                                    </p>
                                                    <p className="mt-1 text-xs text-muted-foreground">
                                                        {user.email}
                                                    </p>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <span className="inline-flex items-center rounded-lg border border-border/70 bg-muted/50 px-2.5 py-1 text-xs font-medium text-foreground">
                                                    {user.role}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <span className="inline-flex items-center rounded-lg bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-600">
                                                    Ativo
                                                </span>
                                            </td>
                                            <td className="p-4 pr-6 text-right">
                                                <button
                                                    onClick={() =>
                                                        abrirPerfil(user)
                                                    }
                                                    className="cursor-pointer font-bold tracking-widest text-muted-foreground hover:text-foreground"
                                                >
                                                    ...
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="clientes" className="space-y-6">
                    <div>
                        <h2 className="text-xl font-bold tracking-tight">
                            Clientes Inativos (Lixeira)
                        </h2>
                        <p className="text-sm text-muted-foreground">
                            Clientes excluídos podem ser restaurados a qualquer
                            momento
                        </p>
                    </div>

                    <div className="overflow-hidden rounded-2xl border border-border/70 bg-background shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse text-left">
                                <thead>
                                    <tr className="border-b border-border/70 bg-muted/30 text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
                                        <th className="p-4 pl-6">Cliente</th>
                                        <th className="p-4">CPF/CNPJ</th>
                                        <th className="p-4">Excluído em</th>
                                        <th className="p-4 pr-6 text-right">
                                            Ações
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/70 text-sm">
                                    {inativos.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan={4}
                                                className="p-8 text-center text-muted-foreground"
                                            >
                                                Nenhum cliente na lixeira.
                                            </td>
                                        </tr>
                                    ) : (
                                        inativos.map((segurado) => (
                                            <tr
                                                key={segurado.id}
                                                className="hover:bg-muted/30"
                                            >
                                                <td className="p-4 pl-6 font-semibold text-foreground">
                                                    {segurado.nome_completo}
                                                </td>
                                                <td className="p-4 text-muted-foreground">
                                                    {segurado.cpf_cnpj}
                                                </td>
                                                <td className="p-4 text-muted-foreground">
                                                    {new Date(
                                                        segurado.deleted_at,
                                                    ).toLocaleDateString(
                                                        'pt-BR',
                                                    )}
                                                </td>
                                                <td className="p-4 pr-6 text-right">
                                                    <button
                                                        onClick={() =>
                                                            restaurarSegurado(
                                                                segurado.id,
                                                            )
                                                        }
                                                        className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-600 hover:bg-emerald-500/20"
                                                    >
                                                        <RotateCcw className="size-3.5" />
                                                        Restaurar
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="sistema">
                    <div className="rounded-2xl border border-border/70 bg-background p-6">
                        <h2 className="mb-2 text-lg font-semibold">
                            Configurações do Sistema
                        </h2>
                        <p className="text-sm text-muted-foreground">
                            Parâmetros gerais do sistema.
                        </p>
                    </div>
                </TabsContent>
            </Tabs>

            {usuarioSelecionado && (
                <UserProfileModal
                    open={openPerfil}
                    setOpen={setOpenPerfil}
                    user={usuarioSelecionado}
                />
            )}
        </div>
    );
}