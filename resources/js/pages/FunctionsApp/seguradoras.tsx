import CreateSeguradoraRamoModal from "@/components/modals/create-cadastro-seg_ramo";
import { Head } from "@inertiajs/react";
import { useState } from "react";

export default function Seguradoras() {


    return (
        <>
            <Head title="Seguradoras e Ramos" />

            <div className="flex flex-col gap-6 p-6">
                {/*Header da Página*/}
                <div className="">
                    
                </div>
            </div>
        </>
        
    );
    <CreateSeguradoraRamoModal open={openModal} setOpen={setOpenModal} />
}