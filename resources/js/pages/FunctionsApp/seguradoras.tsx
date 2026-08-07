import { useState } from "react";
import { Head } from "@inertiajs/react";
import { Plus, Building2, Mail, FileText } from "lucide-react";
import CreateSeguradoraRamoModal from "@/components/modals/create-cadastro-seg_ramo";
import { Button } from "@/components/ui/button";

interface Ramo {
    id: number;
    nome_ramo: string;
}

interface Seguradora {
    id: number;
    nome_fantasia: string;
    razao_social: string;
    cnpj: string;
    contato_nome: string;
    email_suporte: string;
    ramos?: Ramo[];
}

interface Props {
    seguradoras?: Seguradora[];
}

export default function Seguradoras({ seguradoras = [] }: Props) {
    const [openModal, setOpenModal] = useState(false); 

    return (
        <>
            <Head title="Seguradoras" />
            
            <div className="flex flex-col gap-6 p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Seguradoras</h1>
                        <p className="text-sm text-muted-foreground">
                            Gerencie as seguradoras e seus ramos cadastrados
                        </p>
                    </div>
                    <Button onClick={() => setOpenModal(true)}>
                        <Plus className="size-4 mr-2" />
                        Nova Seguradora
                    </Button>
                </div>

                {/* Grid de Cards das Seguradoras */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {seguradoras && seguradoras.length > 0 ? (
                        seguradoras.map((seguradora) => (
                            <div 
                                key={seguradora.id} 
                                className="bg-white border rounded-xl p-6 shadow-sm flex flex-col justify-between gap-4 hover:shadow-md transition-shadow"
                            >
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h3 className="font-semibold text-lg text-gray-900">
                                            {seguradora.nome_fantasia}
                                        </h3>
                                        <p className="text-xs text-gray-500">{seguradora.razao_social}</p>
                                    </div>
                                    <div className="p-2 bg-slate-100 rounded-lg text-slate-700">
                                        <Building2 className="size-5" />
                                    </div>
                                </div>

                                <div className="space-y-2 text-sm text-gray-600 border-t border-b py-3">
                                    <div className="flex items-center gap-2">
                                        <FileText className="size-4 text-gray-400" />
                                        <span>CNPJ: {seguradora.cnpj}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Mail className="size-4 text-gray-400" />
                                        <span className="truncate">{seguradora.email_suporte}</span>
                                    </div>
                                </div>

                                <div>
                                    <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Ramos Atendidos</span>
                                    <div className="flex flex-wrap gap-1.5 mt-2">
                                        {seguradora.ramos && seguradora.ramos.length > 0 ? (
                                            seguradora.ramos.map((ramo) => (
                                                <span 
                                                    key={ramo.id} 
                                                    className="px-2.5 py-0.5 bg-blue-50 text-blue-700 text-xs font-medium rounded-full"
                                                >
                                                    {ramo.nome_ramo}
                                                </span>
                                            ))
                                        ) : (
                                            <span className="text-xs text-gray-400 italic">Nenhum ramo cadastrado</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="text-sm text-gray-500 col-span-full">Nenhuma seguradora cadastrada.</p>
                    )}
                </div>
            </div>

            <CreateSeguradoraRamoModal open={openModal} setOpen={setOpenModal} />
        </>
    );
}