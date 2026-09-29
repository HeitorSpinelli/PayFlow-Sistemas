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

        try {
            $resultado = $this->importacaoSeguradosService->importar(
                caminhoArquivo: $arquivo->getRealPath(),
                nomeOriginal: $arquivo->getClientOriginalName(),
                usuarioId: $request->user()?->id,
            );
        } catch (\Throwable $e) {
            // Linha de defesa extra: o service já captura tudo que consegue
            // prever, mas se algo escapar mesmo assim, devolve um resumo de
            // erro amigável em vez de um 500 cru pro usuário.
            report($e);

            return back()->with(['importResumo' => [
                'total' => 0,
                'importados' => 0,
                'erros' => ['Ocorreu um erro inesperado ao importar o arquivo. Tente novamente ou contate o suporte.'],
                'seguradorasFaltantes' => [],
            ]]);
        }

        return back()->with(['importResumo' => $resultado]);
    }
}
