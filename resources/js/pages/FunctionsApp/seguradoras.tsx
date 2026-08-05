import { useState } from "react";
import { Head } from "@inertiajs/react";
import { Plus, ScrollText, Search, MoreHorizontal, Download, Filter, Check, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { UserRound } from 'lucide-react';
import { X } from "lucide-react";
import CreateSeguradoModal from '@/components/modals/create-segurado-modal'
import { Button } from "@/components/ui/button";
import SeguradoProfileModal from "@/components/modals/create-profile-modal";
import CreateSeguradoraRamoModal from "@/components/modals/create-cadastro-seg_ramo";

//Recebe os segurados e o total de clientes como props e declarando seu tipo
export default function Clientes(){

    const [openModal, setOpenModal] = useState(false); 

    return (
        <>
            <Head title="Clientes" />
            
            <div className="flex flex-col gap-6 p-6">
                
                {/* 1. Header da Página */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Seguradoras</h1>
                        <p className="text-sm text-muted-foreground">
                            Gerencie as seguradoras e seus ramos cadastrados
                        </p>
                    </div>
                    <Button onClick={() => setOpenModal(true)}>
                        <Plus className="size-4" />
                        Nova Seguradora
                    </Button>
                </div>
            </div>
            <CreateSeguradoraRamoModal open={openModal} setOpen={setOpenModal} />
        </>
    )
}