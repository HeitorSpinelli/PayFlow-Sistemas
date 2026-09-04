<?php

namespace App\Console\Commands;

use App\Models\Parcelas;
use App\Services\Apolice\ApoliceService;
use Illuminate\Console\Command;

class CancelarApolicesPorAtrasoDaPrimeiraParcela extends Command
{
    protected $signature = 'apolices:verificar-primeira-parcela';

    protected $description = 'Cancela automaticamente apólices cuja primeira parcela está em atraso (Lei 15.040/2024, art. 21).';

    public function handle(ApoliceService $apoliceService): void
    {
        $parcelasAtrasadas = Parcelas::where('numero_parcela', 1)
            ->where('status_pagamento', 'em_aberto')
            ->where('data_vencimento', '<', now())
            ->get();

        $canceladas = 0;

        foreach ($parcelasAtrasadas as $parcela) {
            $apolice = $parcela->apolice()->withTrashed()->first();

            if (!$apolice || $apolice->trashed()) {
                continue; // já foi cancelada antes, ou não existe mais
            }

            try {
                $apoliceService->destroy($apolice->id);
                $canceladas++;
                $this->info("Apólice #{$apolice->numero_apolice} cancelada — 1ª parcela em atraso.");
            } catch (\Exception $e) {
                $this->error("Falha ao cancelar apólice #{$apolice->id}: " . $e->getMessage());
            }
        }

        $this->info("Processo concluído. {$canceladas} apólice(s) cancelada(s).");
    }
}