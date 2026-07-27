import { useState } from 'react';
import { Head } from '@inertiajs/react';
import {
    Plus,
    ScrollText,
    Search,
    MoreHorizontal,
    Download,
    Filter,
    Check,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
} from 'lucide-react';
import { UserRound } from 'lucide-react';
import { X } from 'lucide-react';
import CreateSeguradoModal from '@/components/modals/create-segurado-modal';
import { Button } from '@/components/ui/button';
import SeguradoProfileModal from '@/components/modals/create-profile-modal';
import CreateSeguradoraRamoModal from '@/components/modals/create-cadastro-seg_ramo';
import { SeguradoraCard } from '@/components/seguradora-card';

// Mantém o nome da função exatamente como estava antes
export default function Seguradoras({ seguradoras }: { seguradoras: any[] }) {
    console.log('Props recebidas no React:', seguradoras);
    return (
        <div className="space-y-6 p-6">
            <h1 className="text-2xl font-bold">Seguradoras e Ramos</h1>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {seguradoras && seguradoras.length > 0 ? (
                    seguradoras.map((seguradora) => (
                        <SeguradoraCard
                            key={seguradora.id}
                            seguradora={seguradora}
                        />
                    ))
                ) : (
                    <p className="text-muted-foreground">
                        Nenhuma seguradora encontrada.
                    </p>
                )}
            </div>
        </div>
    );
}
