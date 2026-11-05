<?php

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

/**
 * Termos de Uso, Política de Privacidade e Termo de Confidencialidade.
 * O aceite é feito na janela do primeiro acesso (ModalTermos, no layout);
 * os documentos ficam disponíveis depois em /termos (menu do usuário).
 */
class TermosController extends Controller
{
    /**
     * Página para consultar os documentos a qualquer momento.
     */
    public function index()
    {
        return inertia('FunctionsApp/termos');
    }

    /**
     * Botão "Aceitar e continuar" da janela de aceite: grava a versão, a
     * data/hora e o IP (comprovação do aceite para a LGPD).
     */
    public function aceitar(Request $request): RedirectResponse
    {
        $request->validate(
            ['aceite' => ['accepted']],
            ['aceite.accepted' => 'Marque que leu e concorda com os documentos para continuar.'],
        );

        $request->user()->forceFill([
            'termos_versao' => config('termos.versao'),
            'termos_aceitos_em' => now(),
            'termos_aceitos_ip' => $request->ip(),
        ])->save();

        return back()->with('success', 'Tudo certo! Bom trabalho no PayFlow.');
    }
}
