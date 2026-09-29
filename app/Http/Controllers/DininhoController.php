<?php

namespace App\Http\Controllers;

use App\Services\Assistente\DininhoService;
use Illuminate\Http\Request;

class DininhoController extends Controller
{
    protected DininhoService $dininhoService;

    public function __construct(DininhoService $dininhoService)
    {
        $this->dininhoService = $dininhoService;
    }

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
