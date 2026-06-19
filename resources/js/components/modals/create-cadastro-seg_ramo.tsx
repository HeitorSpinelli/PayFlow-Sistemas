import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useEffect, useState } from 'react';
import { useForm } from '@inertiajs/react';
import { toast } from 'sonner';
import 'react-toastify/dist/ReactToastify.css';

export default function CreateSeguradoraRamoModal({open, setOpen}: any){
    return(
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                
                {/* Header */}
                <DialogHeader className="mb-2">
                    <div className="flex items-center gap-2 mb-1">
                        <div className="h-8 w-8 bg-emerald-500 rounded-lg flex items-center justify-center shadow-lg shadow-emerald-500/20">
                            <div className="h-4 w-4 border-2 border-white rounded-sm rotate-45"></div>
                        </div>
                        <span className="text-sm font-black tracking-tighter text-emerald-600 uppercase italic">
                            PayFlow-Sistemas
                        </span>
                    </div>
                    <DialogTitle className="text-2xl font-bold tracking-tight">
                        Cadastrar Segurado
                    </DialogTitle>
                    <p className="text-sm text-muted-foreground">
                        Preencha todas as informações do segurado
                    </p>
                </DialogHeader>
                <div className='space-y-2'>
                    <p>Cadastre as Seguradoras Parceiras</p>
                </div>
            </DialogContent>
        </Dialog>
    );
}