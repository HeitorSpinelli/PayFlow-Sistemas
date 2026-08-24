<?php

namespace App\Http\Controllers;

use App\Services\Importacoes\ImportacaoSeguradosService;
use Illuminate\Http\Request;

class ImportacaoController extends Controller
{
    public function __construct(
        private readonly ImportacaoSeguradosService $importacaoSeguradosService,
    ) {}

    public function store(Request $request)
    {
        $request->validate([
            'arquivo' => ['required', 'file', 'mimes:csv,txt', 'max:10240'], // 10 MB
        ]);

        $arquivo = $request->file('arquivo');

        $resultado = $this->importacaoSeguradosService->importar(
            caminhoArquivo: $arquivo->getRealPath(),
            nomeOriginal: $arquivo->getClientOriginalName(),
            usuarioId: $request->user()?->id,
        );

        return back()->with(['importResumo' => $resultado]);
    }
}
