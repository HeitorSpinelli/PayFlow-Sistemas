import { useState } from "react";
import { Head } from "@inertiajs/react";
import { Plus, ScrollText, Search, MoreHorizontal, Download, Filter, Check, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import Profile from "../settings/profile";
import { UserRound } from 'lucide-react';
import CreateApoliceModal from "@/components/clientes/create-apolice-modal";
import { Button } from "@/components/ui/button";

export default function Clientes() {
    const [filtroAberto, setFiltroAberto] = useState(false);
    const [filtroSelecionado, setFiltroSelecionado] = useState("Todos");
    const opcoesFiltro = ["Todos", "Ativos", "Inativos"];
    // Modal de Criação de Cliente
    const [openModal, setOpenModal] = useState(false);

    return (
        <>
            <Head title="Clientes" />

            <div>
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <h1 className="text-2xl font-bold">Apolices</h1>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" onClick={() => setOpenModal(true)}>
                            <Plus size={16} />
                            Nova Apólice
                        </Button>
                    </div>
                </div>
            </div>

            <CreateApoliceModal open={openModal} setOpen={setOpenModal} />
        </>
    );
}