import { Head } from "@inertiajs/react";
import { useState } from "react";
import {
    Search, Settings, Send, Filter, Check, ChevronDown,
    Bell, CircleCheck, Clock4, CircleX, Eye, RotateCw,
    Mail, MessageSquare
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Notificacoes({ notificacoes }: any) {
    const [filtroTipoAberto, setFiltroTipoAberto] = useState(false);
    const [filtroTipoSelecionado, setFiltroTipoSelecionado] = useState("Todos");
    const opcoesTipo = ["Todos", "Vencimento", "Cobrança", "Renovação"];

    const [filtroStatusAberto, setFiltroStatusAberto] = useState(false);
    const [filtroStatusSelecionado, setFiltroStatusSelecionado] = useState("Todos");
    const opcoesStatus = ["Todos", "Enviado", "Pendente", "Falha"];

    const [abaSelecionada, setAbaSelecionada] = useState("historico");

    // Mapeia o tipo de notificação para a cor do badge
    const corTipo: Record<string, string> = {
        Vencimento: "bg-orange-50 text-orange-600",
        Cobrança: "bg-red-50 text-red-600",
        Renovação: "bg-blue-50 text-blue-600",
    };

    // Mapeia o status para cor e ícone do badge
    const statusInfo: Record<string, { cor: string; icon: any }> = {
        Enviado: { cor: "bg-green-50 text-green-600", icon: CircleCheck },
        Pendente: { cor: "bg-orange-50 text-orange-600", icon: Clock4 },
        Falha: { cor: "bg-red-50 text-red-600", icon: CircleX },
    };

    return (
        <>
            <Head title="Notificações" />

            <div className="flex flex-col gap-6 p-6">

                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Notificações</h1>
                        <p className="text-sm text-muted-foreground">
                            Gerencie lembretes automáticos e envio de notificações
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline">
                            <Settings className="size-4" />
                            Configurar
                        </Button>
                        <Button>
                            <Send className="size-4" />
                            Enviar Notificação
                        </Button>
                    </div>
                </div>

                {/* Cards*/}
                <div className="flex gap-4 justify-center">
                    <div className="flex flex-1 items-start justify-between rounded-xl border border-sidebar-border/70 p-6 bg-card shadow-sm">
                        <div className="flex flex-col gap-1">
                            <h2 className="text-sm font-medium text-muted-foreground">Total Hoje</h2>
                            <p className="text-3xl font-bold tracking-tight">10</p>
                        </div>
                        <Bell className="size-10 text-muted-foreground/50" />
                    </div>

                    <div className="flex flex-1 items-start justify-between rounded-xl border border-sidebar-border/70 p-6 bg-card shadow-sm">
                        <div className="flex flex-col gap-1">
                            <h2 className="text-sm font-medium text-muted-foreground">Enviados</h2>
                            <p className="text-3xl font-bold tracking-tight text-green-500">20</p>
                        </div>
                        <CircleCheck className="size-10 text-muted-foreground/50" />
                    </div>

                    <div className="flex flex-1 items-start justify-between rounded-xl border border-sidebar-border/70 p-6 bg-card shadow-sm">
                        <div className="flex flex-col gap-1">
                            <h2 className="text-sm font-medium text-muted-foreground">Pendentes</h2>
                            <p className="text-3xl font-bold tracking-tight text-orange-500">30</p>
                        </div>
                        <Clock4 className="size-10 text-muted-foreground/50" />
                    </div>

                    <div className="flex flex-1 items-start justify-between rounded-xl border border-sidebar-border/70 p-6 bg-card shadow-sm">
                        <div className="flex flex-col gap-1">
                            <h2 className="text-sm font-medium text-muted-foreground">Falhas</h2>
                            <p className="text-3xl font-bold tracking-tight text-red-500">7</p>
                        </div>
                        <CircleX className="size-10 text-muted-foreground/50" />
                    </div>
                </div>

                {/* Abas do Histórico é Automações */}
                <div className="inline-flex w-fit rounded-md border border-sidebar-border bg-muted/30 p-1">
                    <button
                        onClick={() => setAbaSelecionada("historico")}
                        className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                            abaSelecionada === "historico"
                            ? "bg-background text-foreground shadow-sm"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                    >
                        Histórico
                    </button>
                    <button
                        onClick={() => setAbaSelecionada("automacoes")}
                        className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                            abaSelecionada === "automacoes"
                            ? "bg-background text-foreground shadow-sm"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                    >
                        Automações
                    </button>
                </div>

                {abaSelecionada === "historico" && (
                    <div className="rounded-xl border border-sidebar-border bg-card shadow-sm">

                        <div className="p-4 border-b border-sidebar-border flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <h3 className="text-lg font-semibold">Histórico de Notificações</h3>
                                <p className="text-xs text-muted-foreground">10 notificação(ões) encontrada(s)</p>
                            </div>

                            <div className="flex items-center gap-2">
                                {/* Filtro*/}
                                <div className="relative">
                                    <button
                                        onClick={() => {
                                            setFiltroTipoAberto(!filtroTipoAberto);
                                            setFiltroStatusAberto(false);
                                        }}
                                        className="inline-flex h-9 items-center justify-center rounded-md border border-sidebar-border bg-background px-3 text-sm font-medium gap-2 hover:bg-muted transition-colors min-w-[110px]"
                                    >
                                        {filtroTipoSelecionado}
                                        <ChevronDown className={`size-4 text-muted-foreground transition-transform ${filtroTipoAberto ? 'rotate-180' : ''}`} />
                                    </button>

                                    {filtroTipoAberto && (
                                        <div className="absolute right-0 mt-2 w-40 rounded-lg border border-sidebar-border bg-background shadow-lg z-50 overflow-hidden py-1">
                                            {opcoesTipo.map((opcao) => (
                                                <button
                                                    key={opcao}
                                                    onClick={() => {
                                                        setFiltroTipoSelecionado(opcao);
                                                        setFiltroTipoAberto(false);
                                                    }}
                                                    className={`flex w-full items-center justify-between px-3 py-2 text-sm transition-colors ${
                                                        filtroTipoSelecionado === opcao
                                                        ? 'bg-[#2D5A43] text-white'
                                                        : 'hover:bg-muted text-foreground'
                                                    }`}
                                                >
                                                    {opcao}
                                                    {filtroTipoSelecionado === opcao && <Check className="size-4" />}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div className="relative">
                                    <button
                                        onClick={() => {
                                            setFiltroStatusAberto(!filtroStatusAberto);
                                            setFiltroTipoAberto(false);
                                        }}
                                        className="inline-flex h-9 items-center justify-center rounded-md border border-sidebar-border bg-background px-3 text-sm font-medium gap-2 hover:bg-muted transition-colors min-w-[110px]"
                                    >
                                        {filtroStatusSelecionado}
                                        <ChevronDown className={`size-4 text-muted-foreground transition-transform ${filtroStatusAberto ? 'rotate-180' : ''}`} />
                                    </button>

                                    {filtroStatusAberto && (
                                        <div className="absolute right-0 mt-2 w-40 rounded-lg border border-sidebar-border bg-background shadow-lg z-50 overflow-hidden py-1">
                                            {opcoesStatus.map((opcao) => (
                                                <button
                                                    key={opcao}
                                                    onClick={() => {
                                                        setFiltroStatusSelecionado(opcao);
                                                        setFiltroStatusAberto(false);
                                                    }}
                                                    className={`flex w-full items-center justify-between px-3 py-2 text-sm transition-colors ${
                                                        filtroStatusSelecionado === opcao
                                                        ? 'bg-[#2D5A43] text-white'
                                                        : 'hover:bg-muted text-foreground'
                                                    }`}
                                                >
                                                    {opcao}
                                                    {filtroStatusSelecionado === opcao && <Check className="size-4" />}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="overflow-x-auto overflow-y-visible">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-sidebar-border bg-muted/30 text-muted-foreground font-medium">
                                        <th className="h-12 px-4 text-left">Tipo</th>
                                        <th className="h-12 px-4 text-left">Destinatário</th>
                                        <th className="h-12 px-4 text-left">Canal</th>
                                        <th className="h-12 px-4 text-left">Mensagem</th>
                                        <th className="h-12 px-4 text-left">Data Envio</th>
                                        <th className="h-12 px-4 text-left">Status</th>
                                        <th className="h-12 px-4"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {notificacoes?.map((n: any) => {
                                        const status = statusInfo[n.status];
                                        const StatusIcon = status?.icon;
                                        const CanalIcon = n.canal === "Email" ? Mail : MessageSquare;

                                        return (
                                            <tr key={n.id} className="border-b border-sidebar-border hover:bg-muted/30 transition-colors">
                                                <td className="px-4 py-3">
                                                    <span className={`inline-flex px-2.5 py-0.5 rounded-md text-xs font-medium ${corTipo[n.tipo]}`}>
                                                        {n.tipo}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <p className="font-medium">{n.destinatario_nome}</p>
                                                    <p className="text-xs text-muted-foreground">{n.destinatario_contato}</p>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                                                        <CanalIcon className="size-4" />
                                                        {n.canal}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-muted-foreground max-w-[220px] truncate">
                                                    {n.mensagem}
                                                </td>
                                                <td className="px-4 py-3 text-muted-foreground">
                                                    {n.data_envio}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-medium ${status?.cor}`}>
                                                        {StatusIcon && <StatusIcon className="size-3" />}
                                                        {n.status}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    {n.status === "Falha" ? (
                                                        <button className="text-muted-foreground hover:text-foreground">
                                                            <RotateCw className="size-4" />
                                                        </button>
                                                    ) : (
                                                        <button className="text-muted-foreground hover:text-foreground">
                                                            <Eye className="size-4" />
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {abaSelecionada === "automacoes" && (
                    <div className="rounded-xl border border-sidebar-border bg-card shadow-sm p-6 text-sm text-muted-foreground">
                        {/* Mexer nisso aqui depois*/}
                        Conteúdo de automações ainda não implementado.
                    </div>
                )}

            </div>
        </>
    );
}