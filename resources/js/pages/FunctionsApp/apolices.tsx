import { useState } from "react";
import { Head } from "@inertiajs/react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuPortal, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Filter, UserRound } from 'lucide-react';
import Profile from "../settings/profile";

export default function Apolices() {
    // Estado para controlar o Dropdown de Filtro
    const [filtroAberto, setFiltroAberto] = useState(false);
    const [filtroSelecionado, setFiltroSelecionado] = useState("Todos");
    const opcoesFiltro = ["Todos", "Ativas", "Vencidas", "Canceladas", "Renovadas"];
    const tipoapolice = ["Todos os Tipos", "Carro", "Vida", "Residencial", "Empresarial", "Saúde", "Viagem", "Outros"];

    return (
        <>
            <Head title="Apólices" />
        </>
    );
}