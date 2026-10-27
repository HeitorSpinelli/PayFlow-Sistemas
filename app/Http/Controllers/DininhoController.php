<?php

namespace App\Http\Controllers;

use App\Services\Assistente\DininhoService;
use Illuminate\Http\Request;

/**
 * Endpoint do assistente virtual "Dininho" — o widget de chat flutuante
 * (components/dininho/dininho-widget.tsx) presente em todas as telas logadas.
 */
class DininhoController extends Controller
{
    protected DininhoService $dininhoService;

    public function __construct(DininhoService $dininhoService)
    {
        $this->dininhoService = $dininhoService;
    }

    /**
     * Recebe a pergunta digitada no chat do Dininho (mais o histórico recente da
     * conversa) e devolve a resposta em JSON, que o widget exibe como balão.
     * Limitado a 4 perguntas por minuto (throttle na rota).
     */
    public function pergunta(Request $request)
    {
        $dados = $request->validate([
            'pergunta' => 'required|string|max:1000',
            'historico' => 'sometimes|array|max:20',
            'historico.*.autor' => 'required_with:historico|in:usuario,dininho',
            'historico.*.texto' => 'required_with:historico|string|max:1000',
        ]);

        $resposta = $this->dininhoService->perguntar(
            $dados['pergunta'],
            $dados['historico'] ?? []
        );

        return response()->json(['resposta' => $resposta]);
    }
}
