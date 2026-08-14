import { useState } from 'react';
import { Head } from '@inertiajs/react';
import { Building2, ChevronRight, FileText, Mail, Plus } from 'lucide-react';
import CreateSeguradoraRamoModal from '@/components/modals/create-cadastro-seg_ramo';
import { Button } from '@/components/ui/button';
import CreateProfileSeguradoraModal from '@/components/modals/create-profileSeguradora-modal';

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
    // Estados independentes para cada modal
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    
    // Armazena a seguradora selecionada para exibir no perfil/edição
    const [selectedSeguradora, setSelectedSeguradora] = useState<Seguradora | null>(null);

    const abrirDetalhes = (seguradora: Seguradora) => {
        setSelectedSeguradora(seguradora);
        setIsProfileModalOpen(true);
    };

    const fecharDetalhes = (open: boolean) => {
        setIsProfileModalOpen(open);
        if (!open) {
            setSelectedSeguradora(null);
        }
    };

    return (
        <>
            <Head title="Seguradoras" />

            <div className="flex flex-col gap-6 p-6 sm:p-8">
                {/* 1. Header da Página */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <div className="mb-1 flex items-center gap-1.5 text-[10px] font-bold tracking-[0.16em] text-emerald-600 uppercase">
                            <span>Gestão</span>
                            <ChevronRight className="h-3 w-3" />
                            <span>Seguradoras</span>
                        </div>
                        <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
                            Seguradoras
                        </h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Gerencie as seguradoras e seus ramos cadastrados
                        </p>
                    </div>
                    <Button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="h-11 rounded-xl bg-emerald-500 px-5 font-bold text-white shadow-lg shadow-emerald-500/20 transition-all hover:bg-emerald-600 active:scale-[0.98]"
                    >
                        <Plus className="mr-2 size-4" />
                        Nova Seguradora
                    </Button>
                </div>

                {/* 2. Grid de Cards das Seguradoras */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {seguradoras && seguradoras.length > 0 ? (
                        seguradoras.map((seguradora) => (
                            <div
                                key={seguradora.id}
                                className="flex flex-col justify-between gap-4 rounded-2xl border border-border/70 bg-card p-5 shadow-sm transition-all hover:scale-[1.02] hover:border-emerald-500/30"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <h3 className="truncate text-lg font-bold tracking-tight text-foreground">
                                            {seguradora.nome_fantasia}
                                        </h3>
                                        <p className="truncate text-xs text-muted-foreground">
                                            {seguradora.razao_social}
                                        </p>
                                    </div>
                                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
                                        <Building2 className="size-5" />
                                    </span>
                                </div>

                                <div className="space-y-2 border-t border-b border-border/70 py-3 text-sm text-muted-foreground">
                                    <div className="flex items-center gap-2">
                                        <FileText className="size-4 text-muted-foreground/60" />
                                        <span>CNPJ: {seguradora.cnpj}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Mail className="size-4 text-muted-foreground/60" />
                                        <span className="truncate">
                                            {seguradora.email_suporte}
                                        </span>
                                    </div>
                                </div>

                                <div>
                                    <span className="text-[10px] font-bold tracking-[0.14em] text-muted-foreground uppercase">
                                        Ramos Atendidos
                                    </span>
                                    <div className="mt-2 flex flex-wrap gap-1.5">
                                        {seguradora.ramos &&
                                        seguradora.ramos.length > 0 ? (
                                            seguradora.ramos.map((ramo) => (
                                                <span
                                                    key={ramo.id}
                                                    className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-600"
                                                >
                                                    {ramo.nome_ramo}
                                                </span>
                                            ))
                                        ) : (
                                            <span className="text-xs text-muted-foreground italic">
                                                Nenhum ramo cadastrado
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="mt-4 flex items-center justify-end gap-2">
                                    <Button
                                        variant="outline"
                                        onClick={() => abrirDetalhes(seguradora)}
                                        size="sm"
                                        className="h-8 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 font-semibold text-emerald-600 shadow-sm shadow-emerald-500/20 transition-all hover:bg-emerald-500/20 hover:text-emerald-700 active:scale-[0.98]"
                                    >
                                        Detalhes
                                    </Button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="col-span-full rounded-2xl border border-dashed border-border/70 bg-card p-10 text-center">
                            <p className="text-sm text-muted-foreground">
                                Nenhuma seguradora cadastrada.
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal de Criação / Ramos */}
            <CreateSeguradoraRamoModal
                open={isCreateModalOpen}
                setOpen={setIsCreateModalOpen}
            />

            {/* Modal de Perfil / Edição / Exclusão */}
            {selectedSeguradora && (
                <CreateProfileSeguradoraModal
                    open={isProfileModalOpen}
                    setOpen={fecharDetalhes}
                    seguradora={selectedSeguradora}
                />
            )}
        </>
    );
}