<?php

namespace App\Http\Controllers;

use App\Models\Parcelas;
use Carbon\Carbon;

class AgendaController extends Controller
{
    public function index()
    {
        $hoje = Carbon::today();

        $cobrancas = Parcelas::with(['apolice.cliente', 'apolice.ramo'])
            ->whereHas('apolice')
            ->orderBy('data_vencimento')
            ->get()
            ->map(function (Parcelas $parcela) use ($hoje) {
                $apolice = $parcela->apolice;
                $cliente = $apolice?->cliente;

                if ($parcela->status_pagamento === 'paga') {
                    $status = 'pago';
                } elseif ($parcela->data_vencimento && Carbon::parse($parcela->data_vencimento)->startOfDay()->lt($hoje)) {
                    $status = 'atrasado';
                } else {
                    $status = 'pendente';
                }

                return [
                    'id' => $parcela->id,
                    'cliente_id' => $cliente->id ?? null,
                    'cliente_nome' => $cliente->nome_completo ?? 'Cliente não encontrado',
                    'apolice' => $apolice->numero_apolice ?? 'N/A',
                    'ramo' => $apolice->ramo->nome_ramo ?? 'N/A',
                    'telefone' => $cliente->celular_whatsapp ?? $cliente->telefone_fixo ?? null,
                    'valor' => (float) $parcela->valor_parcela,
                    'data_vencimento' => Carbon::parse($parcela->data_vencimento)->format('Y-m-d'),
                    'status' => $status,
                    'numero_parcela' => $parcela->numero_parcela,
                    'total_parcelas' => $apolice->quantidade_parcelas,
                ];
            })
            ->values();

        return inertia('FunctionsApp/agenda', [
            'cobrancas' => $cobrancas,
        ]);
    }
}
