import { Head } from "@inertiajs/react";
import { useState } from "react";
import {
    Search, Download, Filter, Plus,
    Check, ChevronDown, ChevronLeft, ChevronRight,
    CircleCheck, DollarSign, Receipt, Calendar
} from "lucide-react";
import { Button } from "@/components/ui/button";
import CreatePagamentoModal from "@/components/modals/create-pagamentos-modal";

export default function Pagamentos({ clientes, apolices }: any) {
    const [filtroAberto, setFiltroAberto] = useState(false);
    const [filtroSelecionado, setFiltroSelecionado] = useState("Todos");
    const opcoesFiltro = ["Todos", "Confirmados", "Pendentes"];

    const [exportarAberto, setExportarAberto] = useState(false);

    const [openModal, setOpenModal] = useState(false);

    return (
        <>
            <Head title="Pagamentos" />

            <div className="flex flex-col gap-6 p-6">

                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Pagamentos</h1>
                        <p className="text-sm text-muted-foreground">
                            Gerencie os pagamentos e recebimentos cadastrados
                        </p>
                    </div>
                    <Button onClick={() => setOpenModal(true)}>
                        <Plus className="size-4" />
                        Registrar Pagamento
                    </Button>
                </div>

                {/* Cards de resumo financeiro */}
                <div className="flex gap-4 justify-center">
                    <div className="flex flex-1 items-start justify-between rounded-xl border border-sidebar-border/70 p-6 bg-card shadow-sm">
                        <div className="flex flex-col gap-1">
                            <h2 className="text-sm font-medium text-muted-foreground">Total Recebido</h2>
                            <p className="text-3xl font-bold tracking-tight text-green-500">R$ 20,00</p>
                        </div>
                        <DollarSign className="size-10 text-muted-foreground/50" />
                    </div>

                    <div className="flex flex-1 items-start justify-between rounded-xl border border-sidebar-border/70 p-6 bg-card shadow-sm">
                        <div className="flex flex-col gap-1">
                            <h2 className="text-sm font-medium text-muted-foreground">Total Registrado</h2>
                            <p className="text-3xl font-bold tracking-tight text-green-500">20,00</p>
                        </div>
                        <Receipt className="size-10 text-muted-foreground/50" />
                    </div>

                    <div className="flex flex-1 items-start justify-between rounded-xl border border-sidebar-border/70 p-6 bg-card shadow-sm">
                        <div className="flex flex-col gap-1">
                            <h2 className="text-sm font-medium text-muted-foreground">Confirmados</h2>
                            <p className="text-3xl font-bold tracking-tight text-green-500">20,00</p>
                        </div>
                        <CircleCheck className="size-10 text-muted-foreground/50" />
                    </div>

                    <div className="flex flex-1 items-start justify-between rounded-xl border border-sidebar-border/70 p-6 bg-card shadow-sm">
                        <div className="flex flex-col gap-1">
                            <h2 className="text-sm font-medium text-muted-foreground">Pendentes</h2>
                            {/* Pendentes usa laranja para indicar atenção, diferente dos outros cards */}
                            <p className="text-3xl font-bold tracking-tight text-orange-500">7,00</p>
                        </div>
                        <Calendar className="size-10 text-muted-foreground/50" />
                    </div>
                </div>

                <div className="rounded-xl border border-sidebar-border bg-card shadow-sm">

                    <div className="p-4 border-b border-sidebar-border flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h3 className="text-lg font-semibold">Lista de Pagamentos</h3>
                            <p className="text-xs text-muted-foreground">67 pagamento(s) encontrado(s)</p>
                        </div>

                        <div className="flex items-center gap-2">
                            <div className="relative">
                                {/* Ícone posicionado absolutamente sobre o input */}
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                                <input
                                    type="text"
                                    placeholder="Buscar por cliente, apólice..."
                                    className="h-9 w-64 rounded-md border border-sidebar-border bg-background pl-9 pr-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                />
                            </div>

                            {/* Dropdown de filtro por status */}
                            <div className="relative">
                                <button
                                    onClick={() => {
                                        setFiltroAberto(!filtroAberto);
                                        // Fecha o dropdown de exportar ao abrir o de filtro
                                        setExportarAberto(false);
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
                                                    // Opção ativa: fundo verde escuro com texto branco
                                                    ? 'bg-[#2D5A43] text-white'
                                                    : 'hover:bg-muted text-foreground'
                                                }`}
                                            >
                                                {opcao}
                                                {/* Checkmark visível apenas na opção selecionada */}
                                                {filtroSelecionado === opcao && <Check className="size-4" />}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* TODO: implementar lógica de exportação */}
                            <button
                                onClick={() => setExportarAberto(false)}
                                className="inline-flex h-9 items-center justify-center rounded-md border border-sidebar-border bg-background px-3 text-sm font-medium gap-2 hover:bg-muted transition-colors"
                            >
                                <Download className="size-4 text-muted-foreground" />
                                Exportar
                            </button>
                        </div>
                    </div>

                    {/* Tabela — tbody ainda sem dados, aguardando integração com API */}
                    <div className="overflow-x-auto overflow-y-visible">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-sidebar-border bg-muted/30 text-muted-foreground font-medium">
                                    <th className="h-12 px-4 text-left">ID</th>
                                    <th className="h-12 px-4 text-left">Cliente</th>
                                    <th className="h-12 px-4 text-left">Apólice / Parcela</th>
                                    <th className="h-12 px-4 text-left">Valor</th>
                                    <th className="h-12 px-4 text-left">Data Pagamento</th>
                                    <th className="h-12 px-4 text-left">Forma</th>
                                    <th className="h-12 px-4 text-left">Status</th>
                                    <th className="h-12 px-4 text-left">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                            </tbody>
                        </table>
                    </div>

                    {/* Paginação */}
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

            {/* Modal fora do div principal para não herdar estilos de layout */}
            <CreatePagamentoModal
                open={openModal}
                setOpen={setOpenModal}
                clientes={clientes}
                apolices={apolices}
            />
        </>
    );
}
