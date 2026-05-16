import { Head } from "@inertiajs/react";
import { useState } from "react";
import {
    ScrollText, Search, Download, Filter,
    Check, ChevronDown, ChevronLeft, ChevronRight, Clock4,
    CircleCheck, TriangleAlert
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Cobrancas() {
    const [filtroAberto, setFiltroAberto] = useState(false);
    const [filtroSelecionado, setFiltroSelecionado] = useState("Todos");
    const opcoesFiltro = ["Todos", "Pagas", "Pendentes", "Atrasadas"];

    const [periodoAberto, setPeriodoAberto] = useState(false);
    const [periodoSelecionado, setPeriodoSelecionado] = useState("Este mês");
    const opcoesPeriodo = ["Este mês", "Mês passado"];

    const [openModal, setOpenModal] = useState(false);

    return (
        <>
            <Head title="Cobranças" />

            <div className="flex flex-col gap-6 p-6">

                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Cobranças</h1>
                        <p className="text-sm text-muted-foreground">
                            Gerencie as cobranças e pagamentos cadastrados
                        </p>
                    </div>
                    <Button variant="outline" onClick={() => setOpenModal(true)}>
                        <Download className="size-4" />
                        Exportar
                    </Button>
                </div>

                <div className="flex gap-4 justify-center">
                    <div className="flex flex-1 items-start justify-between rounded-xl border border-sidebar-border/70 p-6 bg-card shadow-sm">
                        <div className="flex flex-col gap-1">
                            <h2 className="text-sm font-medium text-muted-foreground">Pagas</h2>
                            <p className="text-3xl font-bold tracking-tight text-green-500">30</p>
                        </div>
                        <CircleCheck className="size-10 text-muted-foreground/50" />
                    </div>

                    <div className="flex flex-1 items-start justify-between rounded-xl border border-sidebar-border/70 p-6 bg-card shadow-sm">
                        <div className="flex flex-col gap-1">
                            <h2 className="text-sm font-medium text-muted-foreground">Pendentes</h2>
                            <p className="text-3xl font-bold tracking-tight text-orange-500">19</p>
                        </div>
                        <Clock4 className="size-10 text-muted-foreground/50" />
                    </div>

                    <div className="flex flex-1 items-start justify-between rounded-xl border border-sidebar-border/70 p-6 bg-card shadow-sm">
                        <div className="flex flex-col gap-1">
                            <h2 className="text-sm font-medium text-muted-foreground">Atrasadas</h2>
                            <p className="text-3xl font-bold tracking-tight text-red-500">18</p>
                        </div>
                        <TriangleAlert className="size-10 text-muted-foreground/50" />
                    </div>
                </div>

                <div className="rounded-xl border border-sidebar-border bg-card shadow-sm">

                    <div className="p-4 border-b border-sidebar-border flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h3 className="text-lg font-semibold">Lista de Cobranças</h3>
                            <p className="text-xs text-muted-foreground">67 cobrança(s) encontrada(s)</p>
                        </div>

                        <div className="flex items-center gap-2">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                                <input
                                    type="text"
                                    placeholder="Buscar por cliente, vencimento..."
                                    className="h-9 w-64 rounded-md border border-sidebar-border bg-background pl-9 pr-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                />
                            </div>

                            {/* Filtro de Status */}
                            <div className="relative">
                                <button
                                    onClick={() => {
                                        setFiltroAberto(!filtroAberto);
                                        setPeriodoAberto(false);
                                    }}
                                    className="inline-flex h-9 items-center justify-center rounded-md border border-sidebar-border bg-background px-3 text-sm font-medium gap-2 hover:bg-muted transition-colors min-w-[110px]"
                                >
                                    <Filter className="size-4 text-muted-foreground" />
                                    {filtroSelecionado}
                                    <ChevronDown className={`size-4 text-muted-foreground transition-transform ${filtroAberto ? 'rotate-180' : ''}`} />
                                </button>

                                {filtroAberto && (
                                    <div className="absolute right-0 mt-2 w-40 rounded-lg border border-sidebar-border bg-background shadow-lg z-50 overflow-hidden py-1">
                                        {opcoesFiltro.map((opcao) => (
                                            <button
                                                key={opcao}
                                                onClick={() => {
                                                    setFiltroSelecionado(opcao);
                                                    setFiltroAberto(false);
                                                }}
                                                className={`flex w-full items-center justify-between px-3 py-2 text-sm transition-colors ${
                                                    filtroSelecionado === opcao
                                                    ? 'bg-[#2D5A43] text-white'
                                                    : 'hover:bg-muted text-foreground'
                                                }`}
                                            >
                                                {opcao}
                                                {filtroSelecionado === opcao && <Check className="size-4" />}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="relative">
                                <button
                                    onClick={() => {
                                        setPeriodoAberto(!periodoAberto);
                                        setFiltroAberto(false);
                                    }}
                                    className="inline-flex h-9 items-center justify-center rounded-md border border-sidebar-border bg-background px-3 text-sm font-medium gap-2 hover:bg-muted transition-colors min-w-[120px]"
                                >
                                    <Filter className="size-4 text-muted-foreground" />
                                    {periodoSelecionado}
                                    <ChevronDown className={`size-4 text-muted-foreground transition-transform ${periodoAberto ? 'rotate-180' : ''}`} />
                                </button>

                                {periodoAberto && (
                                    <div className="absolute right-0 mt-2 w-40 rounded-lg border border-sidebar-border bg-background shadow-lg z-50 overflow-hidden py-1">
                                        {opcoesPeriodo.map((opcao) => (
                                            <button
                                                key={opcao}
                                                onClick={() => {
                                                    setPeriodoSelecionado(opcao);
                                                    setPeriodoAberto(false);
                                                }}
                                                className={`flex w-full items-center justify-between px-3 py-2 text-sm transition-colors ${
                                                    periodoSelecionado === opcao
                                                    ? 'bg-[#2D5A43] text-white'
                                                    : 'hover:bg-muted text-foreground'
                                                }`}
                                            >
                                                {opcao}
                                                {periodoSelecionado === opcao && <Check className="size-4" />}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Tabela */}
                   <div className="overflow-x-auto overflow-y-visible">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-sidebar-border bg-muted/30 text-muted-foreground font-medium">
                                    <th className="h-12 px-4 text-left">Cliente</th>
                                    <th className="h-12 px-4 text-left">Vencimento</th>
                                    <th className="h-12 px-4 text-left">Valor</th>
                                    <th className="h-12 px-4 text-left">Tipo</th>
                                    <th className="h-12 px-4 text-left">Status</th>
                                    <th className="h-12 px-4"></th>
                                </tr>
                            </thead>
                            <tbody>
                            </tbody>
                        </table>
                    </div>

                    <div className="flex items-center justify-between px-4 py-4 border-t border-sidebar-border bg-muted/10">
                        <div className="text-sm text-muted-foreground">
                            Mostrando <span className="font-medium text-foreground">1</span> de <span className="font-medium text-foreground">1</span> resultados
                        </div>
                        <div className="flex items-center gap-2">
                            <button className="inline-flex h-8 items-center justify-center rounded-md border border-sidebar-border bg-background px-3 text-xs font-medium gap-1 hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                                <ChevronLeft className="size-3" />
                                Anterior
                            </button>
                            <button className="inline-flex h-8 items-center justify-center rounded-md border border-sidebar-border bg-background px-3 text-xs font-medium gap-1 hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                                Próxima
                                <ChevronRight className="size-3" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
