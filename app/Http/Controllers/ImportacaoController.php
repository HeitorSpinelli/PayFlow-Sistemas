<?php

namespace App\Http\Controllers;

use App\Services\Importacoes\ImportacaoSeguradosService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Http\Response;

/**
 * Tela Importar (/importar, importar.tsx): importação de clientes, apólices
 * e parcelas a partir de planilha do Excel (.xlsx) ou CSV.
 *
 * Fluxo: o usuário escolhe o arquivo → verificar() devolve a prévia (sem
 * gravar) → "Importar" chama store() → a tela mostra o resultado.
 */
class ImportacaoController extends Controller
{
    // Teto da aplicação; o limite real ainda depende do php.ini (ver limiteBytes()).
    private const LIMITE_APLICACAO_BYTES = 10 * 1024 * 1024;

    public function __construct(
        private readonly ImportacaoSeguradosService $importacao,
    ) {}

    /**
     * Página da tela Importar. importResumo é o resultado da última
     * importação (vem do store() pela sessão).
     */
    public function index()
    {
        return inertia('FunctionsApp/importar', [
            'importResumo' => session('importResumo'),
            'limiteArquivoMb' => round($this->limiteBytes() / 1024 / 1024, 1),
        ]);
    }

    /**
     * Prévia (POST /importar-dados/verificar): analisa a planilha e devolve o
     * que seria importado, com erros e avisos por linha. Não grava nada.
     */
    public function verificar(Request $request): JsonResponse
    {
        $arquivo = $this->validarArquivo($request);

        try {
            return response()->json($this->importacao->verificar($arquivo->getRealPath(), $arquivo->getClientOriginalName()));
        } catch (\Throwable $e) {
            report($e);

            return response()->json(['message' => 'Não foi possível analisar a planilha. Tente de novo ou contate o suporte.'], 500);
        }
    }

    /**
     * Botão "Importar": grava as linhas válidas e volta para a tela com o
     * resumo (flash importResumo).
     */
    public function store(Request $request): RedirectResponse
    {
        $arquivo = $this->validarArquivo($request);

        try {
            $resumo = $this->importacao->importar(
                $arquivo->getRealPath(),
                $arquivo->getClientOriginalName(),
                $request->user()?->id,
            );
        } catch (\Throwable $e) {
            report($e);
            $resumo = [
                'erroGeral' => 'Ocorreu um erro inesperado e nada foi importado. Tente de novo ou contate o suporte.',
                'total' => 0, 'validas' => 0, 'importados' => 0,
            ];
        }

        return back()->with('importResumo', $resumo + ['arquivo' => $arquivo->getClientOriginalName()]);
    }

    /**
     * Botão "Baixar modelo": CSV gerado na hora, com exemplos que usam as
     * seguradoras e ramos cadastrados — o modelo importa sem erro.
     */
    public function modelo(): Response
    {
        return response($this->importacao->modeloCsv(), 200, [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="modelo-importacao-payflow.csv"',
        ]);
    }

    private function validarArquivo(Request $request): UploadedFile
    {
        $limiteKb = (int) floor($this->limiteBytes() / 1024);
        $limiteMb = round($limiteKb / 1024, 1);

        $request->validate([
            'arquivo' => [
                'required',
                'file',
                "max:{$limiteKb}",
                function (string $atributo, $arquivo, \Closure $falhar) {
                    $extensao = strtolower($arquivo->getClientOriginalExtension());

                    if ($extensao === 'xls') {
                        $falhar('Arquivos .xls (Excel 97-2003) não são aceitos. No Excel, use "Salvar como" e escolha .xlsx ou .csv.');
                    } elseif (! in_array($extensao, ['xlsx', 'csv', 'txt'], true)) {
                        $falhar('Envie uma planilha do Excel (.xlsx) ou um arquivo .csv.');
                    }
                },
            ],
        ], [
            'arquivo.required' => 'Escolha uma planilha para importar.',
            'arquivo.file' => 'Não foi possível receber o arquivo. Tente de novo.',
            'arquivo.uploaded' => "Não foi possível enviar o arquivo. Ele pode ter no máximo {$limiteMb} MB.",
            'arquivo.max' => "A planilha pode ter no máximo {$limiteMb} MB.",
        ]);

        return $request->file('arquivo');
    }

    /**
     * Menor entre o teto da aplicação e os limites de upload do php.ini —
     * a tela mostra este número, para não prometer 10 MB onde o servidor
     * recusa acima de 2 MB.
     */
    private function limiteBytes(): int
    {
        $emBytes = function (string $valor): int {
            $valor = trim($valor);
            $numero = (int) $valor;

            return match (strtolower(substr($valor, -1))) {
                'g' => $numero * 1024 ** 3,
                'm' => $numero * 1024 ** 2,
                'k' => $numero * 1024,
                default => $numero,
            };
        };

        $limites = array_filter([
            self::LIMITE_APLICACAO_BYTES,
            $emBytes((string) ini_get('upload_max_filesize')),
            $emBytes((string) ini_get('post_max_size')),
        ], fn ($l) => $l > 0);

        return min($limites);
    }
}
