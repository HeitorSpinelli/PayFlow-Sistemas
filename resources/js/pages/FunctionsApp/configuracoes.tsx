import { Head } from "@inertiajs/react";
import { useState } from "react";
import { Plus, ScrollText, Search, MoreHorizontal, Download, Filter, Check, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import Profile from "../settings/profile";
import { UserRound } from 'lucide-react';

/**
 * Página "Configurações" (FunctionsApp/configuracoes) — PLACEHOLDER.
 *
 * Não há rota em routes/web.php que renderize esta página nem link na
 * sidebar: ela não aparece em lugar nenhum do sistema hoje. Os estados e
 * listas abaixo não são usados no JSX (só o <Head>), e os imports de ícones
 * e de `Profile` também não. As configurações reais do usuário ficam em
 * pages/settings/* (perfil, senha, aparência).
 */
export default function Configuracoes() {
    const [filtroSelecionado, setFiltroSelecionado] = useState("Todos");
    const [tipoSelecionado, setTipoSelecionado] = useState("Todos os Tipos");

    const opcoesFiltro = ["Todos", "Vencimento", "Renovação", "Atraso"];
    const tipoAgenda = ["Todos os Tipos", "Vencimento", "Renovação", "Atraso"];

    return (
        <>
            <Head title="configuracoes"/>
        </>
    );
}  