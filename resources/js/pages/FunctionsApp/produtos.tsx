import { Head } from "@inertiajs/react";
import { useState } from "react";
import { Plus, ScrollText, Search, MoreHorizontal, Download, Filter, Check, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import Profile from "../settings/profile";
import { UserRound } from 'lucide-react';
{/*import {CSVLink} from 'react-csv';*/}

export default function Produtos() {
    const [filtroSelecionado, setFiltroSelecionado] = useState("Todos");
    const [tipoSelecionado, setTipoSelecionado] = useState("Todos os Tipos");

    const opcoesFiltro = ["Todos", "Vencimento", "Renovação", "Atraso"];
    const tipoAgenda = ["Todos os Tipos", "Vencimento", "Renovação", "Atraso"];

    return (
        <>
            <Head title="Produtos" />
        </>
    );
}  