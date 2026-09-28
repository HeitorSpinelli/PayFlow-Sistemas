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
        $request->validate([
            'pergunta' => 'required|string|max:1000',
        ]);

        $pergunta = $request->input('pergunta');
        $resposta = $this->dininhoService->perguntar($pergunta);

        return response()->json(['resposta' => $resposta]);
    }
}