import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
interface User {
    id: number;
    name: string;
    email: string;
    role: string;
    created_at?: string;
}

interface Props {
    users: User[];
}

export default function Administracao({ users }: Props) {
    console.log("Usuários recebidos no front:", users);
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

                    {/* Tabela de Usuários Estática */}
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
                                            <td className="cursor-pointer p-4 pr-6 text-right font-bold tracking-widest text-muted-foreground hover:text-foreground">
                                                ...
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="clientes">
                    <div className="rounded-2xl border border-border/70 bg-background p-6">
                        <h2 className="mb-2 text-lg font-semibold">
                            Gerenciamento de Usuários
                        </h2>
                        <p className="text-sm text-muted-foreground">
                            Listagem e controle de acessos dos usuários.
                        </p>
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
        </div>
    );
}
