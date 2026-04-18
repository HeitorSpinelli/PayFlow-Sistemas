import { useState } from "react";
import { Head } from "@inertiajs/react";

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

import {
    Plus,
    ScrollText,
    Search,
    MoreHorizontal,
    Download,
    Filter,
    Check,
    ChevronDown,
    X
} from "lucide-react";

export default function Apolices() {

    const [filtroSelecionado, setFiltroSelecionado] = useState("Todos");
    const [tipoSelecionado, setTipoSelecionado] = useState("Todos os Tipos");

    const opcoesFiltro = ["Todos", "Ativas", "Vencidas", "Canceladas", "Renovadas"];
    const tipoapolice = ["Todos os Tipos", "Carro", "Vida", "Residencial", "Empresarial", "Saúde", "Viagem", "Outros"];

    return (
        <>
            <Head title="Apólices" />

            <div className="flex flex-col gap-6 p-6">

                {/* HEADER */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold">Apólices</h1>
                        <p className="text-sm text-muted-foreground">
                            Gerencie as apólices de seguros e suas vigências
                        </p>
                    </div>

                    <button className="inline-flex items-center gap-2 bg-[#2D5A43] text-white px-4 py-2 rounded-md hover:bg-[#244835]">
                        <Plus className="size-5" />
                        Nova Apólice
                    </button>
                </div>

                {/* CARDS */}
                <div className="flex gap-4">
                    <Card titulo="Total de Apólices" valor="1" Icon={ScrollText} />
                    <Card titulo="Ativas" valor="1" Icon={Check} />
                    <Card titulo="Vencidas" valor="0" Icon={X} color="text-yellow-500" />
                    <Card titulo="Canceladas" valor="0" Icon={X} color="text-red-500" />
                </div>

                {/* TABELA */}
                <div className="rounded-xl border bg-card shadow-sm overflow-hidden">

                    {/* TOOLBAR */}
                    <div className="p-4 border-b flex flex-col md:flex-row justify-between gap-4">

                        <div>
                            <h3 className="text-lg font-semibold">Lista de Apólices</h3>
                            <p className="text-xs text-muted-foreground">
                                1 apólice(s) encontrada(s)
                            </p>
                        </div>

                        <div className="flex items-center gap-2">

                            {/* BUSCA */}
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                                <input
                                    type="text"
                                    placeholder="Buscar por número ou cliente"
                                    className="h-9 w-64 rounded-md border pl-9 pr-3 text-sm"
                                />
                            </div>

                            {/* FILTRO STATUS */}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button className="inline-flex h-9 items-center gap-2 rounded-md border px-3 text-sm">
                                        <Filter className="size-4" />
                                        {filtroSelecionado}
                                        <ChevronDown className="size-4" />
                                    </button>
                                </DropdownMenuTrigger>

                                <DropdownMenuContent className="w-40">
                                    {opcoesFiltro.map((opcao) => (
                                        <DropdownMenuItem
                                            key={opcao}
                                            onClick={() => setFiltroSelecionado(opcao)}
                                            className="flex justify-between"
                                        >
                                            {opcao}
                                            {filtroSelecionado === opcao && <Check className="size-4" />}
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>

                            {/* FILTRO TIPO */}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button className="inline-flex h-9 items-center gap-2 rounded-md border px-3 text-sm">
                                        {tipoSelecionado}
                                        <ChevronDown className="size-4" />
                                    </button>
                                </DropdownMenuTrigger>

                                <DropdownMenuContent className="w-44">
                                    {tipoapolice.map((tipo) => (
                                        <DropdownMenuItem
                                            key={tipo}
                                            onClick={() => setTipoSelecionado(tipo)}
                                            className="flex justify-between"
                                        >
                                            {tipo}
                                            {tipoSelecionado === tipo && <Check className="size-4" />}
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>

                            {/* EXPORTAR */}
                            <button className="inline-flex h-9 items-center gap-2 rounded-md border px-3 text-sm">
                                <Download className="size-4" />
                                Exportar
                            </button>
                        </div>
                    </div>

                    {/* TABLE */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b bg-muted/30 text-muted-foreground">
                                    <th className="p-4 text-left">Apólice</th>
                                    <th className="p-4 text-left">Cliente</th>
                                    <th className="p-4 text-left">Tipo / Seguradora</th>
                                    <th className="p-4 text-left">Valor</th>
                                    <th className="p-4 text-left">Parcelas</th>
                                    <th className="p-4 text-left">Vigência</th>
                                    <th className="p-4 text-left">Status</th>
                                    <th className="p-4 text-right"></th>
                                </tr>
                            </thead>

                            <tbody>
                                <tr className="border-b hover:bg-muted/50">

                                    <td className="p-4 font-medium">
                                        APO-2024-0684
                                    </td>

                                    <td className="p-4">
                                        <div>
                                            <p className="font-medium">Enzo Heitor Spinelli</p>
                                            <p className="text-xs text-muted-foreground">
                                                45688255803
                                            </p>
                                        </div>
                                    </td>

                                    <td className="p-4">
                                        <div>
                                            <p>Residencial</p>
                                            <p className="text-xs text-muted-foreground">
                                                Porto Seguro
                                            </p>
                                        </div>
                                    </td>

                                    <td className="p-4">
                                        <p>R$ 2.563,00</p>
                                        <p className="text-xs text-muted-foreground">
                                            R$ 213,58/mês
                                        </p>
                                    </td>

                                    <td className="p-4">
                                        <div className="text-xs flex justify-between">
                                            <span>6/12</span>
                                            <span>50%</span>
                                        </div>
                                        <div className="h-2 bg-gray-200 rounded-full mt-1">
                                            <div className="h-2 bg-green-600 w-1/2 rounded-full"></div>
                                        </div>
                                    </td>

                                    <td className="p-4 text-xs">
                                        24/03/2026 <br />
                                        <span className="text-muted-foreground">
                                            até 24/03/2027
                                        </span>
                                    </td>

                                    <td className="p-4">
                                        <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full">
                                            Ativa
                                        </span>
                                    </td>

                                    <td className="p-4 text-right">
                                        <button className="p-2 hover:bg-muted rounded-md">
                                            <MoreHorizontal className="size-4" />
                                        </button>
                                    </td>

                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* FOOTER */}
                    <div className="p-4 flex justify-between text-sm text-muted-foreground">
                        <span>Mostrando 1 de 1 apólices</span>

                        <div className="flex gap-2">
                            <button className="px-3 py-1 border rounded-md">Anterior</button>
                            <button className="px-3 py-1 border rounded-md">Próximo</button>
                        </div>
                    </div>

                </div>
            </div>
        </>
    );
}


/* COMPONENTE CARD */
function Card({ titulo, valor, Icon, color = "text-green-500" }) {
    return (
        <div className="flex flex-1 justify-between rounded-xl border p-6 bg-card shadow-sm">
            <div>
                <h2 className="text-sm text-muted-foreground">{titulo}</h2>
                <p className={`text-3xl font-bold ${color}`}>{valor}</p>
            </div>
            <Icon className="size-8 text-muted-foreground" />
        </div>
    );
}
