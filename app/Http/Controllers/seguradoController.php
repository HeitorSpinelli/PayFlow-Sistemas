<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreSeguradoRequest;
use App\Http\Requests\UpdateSeguradoRequest;
use App\Models\Segurado;
use App\Services\SeguradoService;
use Illuminate\Http\Request; // <-- IMPORTANTE: Adicionado para receber os dados da pesquisa

class SeguradoController extends Controller
{
    //1. Declaração do service como propriedade
    protected SeguradoService $seguradoService;

    //2. Injeta pelo construtor
    public function __construct(SeguradoService $seguradoService)
    {
        $this->seguradoService = $seguradoService;
    }

    //3. Usa no store
    public function store(StoreSeguradoRequest $request)
    {

        $data = $request->validated();
        $this->seguradoService->store($data);
        return redirect()->back()->with('success', 'Segurado cadastrado com sucesso!');
    }

    // 4. Modificado: Injetamos Request $request para capturar o que o React mandar
    public function show(Request $request)
    {
        // 1. Inicia a query base sem executar no banco ainda
        $query = Segurado::query();

        // 2. Se o usuário digitou algo na busca (Nome ou CPF)
        if ($request->filled('busca')) {
            $busca = $request->input('busca');
            $buscaNumeros = preg_replace('/\D/', '', $busca);

            $query->where(function ($q) use ($busca, $buscaNumeros) {
                // Se o usuário digitou números (CPF/CNPJ com 3 ou mais dígitos)
                if (!empty($buscaNumeros) && strlen($buscaNumeros) >= 3) {
                    $q->where('cpf_cnpj', 'like', "{$buscaNumeros}%");
                } else {
                    // Se for Nome, divide por palavras para permitir pesquisar "João Silva" 
                    // e encontrar "João Carlos da Silva"
                    $termos = explode(' ', trim($busca));
                    $q->where(function ($subQ) use ($termos) {
                        foreach ($termos as $termo) {
                            if (!empty($termo)) {
                                $termoMinusculo = '%' . mb_strtolower($termo, 'UTF-8') . '%';
                                $subQ->whereRaw('LOWER(nome_completo) LIKE ?', [$termoMinusculo]);
                            }
                        }
                    });
                }
            });
        }

        // 3. Se o usuário usar o filtro de Status do React
        if ($request->filled('status')) {
            $status = $request->input('status');

            if ($status === 'Ativos') {
                $query->whereHas('apolices', function ($q) {
                    $q->where('fim_vigencia', '>=', now()->today());
                });
            } elseif ($status === 'Inativos') {
                $query->where(function ($q) {
                    $q->whereDoesntHave('apolices')
                        ->orWhereDoesntHave('apolices', function ($qApolice) {
                            $qApolice->where('fim_vigencia', '>=', now()->today());
                        });
                });
            }
        }

        // 4. Pagina os segurados e aplica withQueryString() para a paginação não perder o filtro
        $segurados = $query->orderBy('id')->paginate(10)->withQueryString();

        // 5. Conta rápida no banco para o card "Total" (não carrega registros na memória)
        $total = Segurado::count();

        // 6. Conta rápida no banco apenas dos ativos
        $totalAtivos = Segurado::whereHas('apolices', function ($query) {
            $query->where('fim_vigencia', '>=', now()->today());
        })->count();

        // 7. Conta rápida no banco apenas dos inativos
        $totalInativos = Segurado::whereDoesntHave('apolices')
            ->orWhereDoesntHave('apolices', function ($query) {
                $query->where('fim_vigencia', '>=', now()->today());
            })->count();

        return inertia('FunctionsApp/clientes', [
            'segurados'     => $segurados,
            'total'         => $total,
            'totalAtivos'   => $totalAtivos,
            'totalInativos' => $totalInativos,
        ]);
    }

    public function destroy(int $id)
    {
        try {
            $this->seguradoService->destroy($id);
            return redirect()->back()->with('success', 'Segurado excluído com sucesso!');
        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'Erro ao excluir segurado: ' . $e->getMessage());
        }
    }

    public function update(UpdateSeguradoRequest $request, int $id)
    {
        try {
            $data = $request->validated();
            $this->seguradoService->update($id, $data);
            return redirect()->back()->with('success', 'Segurado atualizado com sucesso!');
        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'Erro ao atualizar segurado: ' . $e->getMessage());
        }
    }

    public function exportar()
    {
        // 1. Nome do arquivo que vai ser baixado (ex: segurados-2026-06-06.csv)
        $fileName = 'segurados-' . date('Y-m-d') . '.csv';

        // 2. Busca todos os segurados do banco de dados
        $segurados = Segurado::all();

        // 3. Define os cabeçalhos HTTP para o navegador entender que é um arquivo para download
        $headers = [
            "Content-type"        => "text/csv; charset=UTF-8",
            "Content-Disposition" => "attachment; filename=$fileName",
            "Pragma"              => "no-cache",
            "Cache-Control"       => "must-revalidate, post-check=0, pre-check=0",
            "Expires"             => "0"
        ];

        // 4. Monta o conteúdo da planilha linha por linha
        $callback = function () use ($segurados) {
            $file = fopen('php://output', 'w');

            // Adiciona o BOM do UTF-8 para o Excel reconhecer acentos (como ç, ã, é) sem corromper
            fprintf($file, chr(0xEF) . chr(0xBB) . chr(0xBF));

            // Cabeçalho da Tabela (A primeira linha do Excel)
            fputcsv($file, ['ID', 'Nome Completo', 'CPF/CNPJ', 'Telefone Fixo', 'Celular/WhatsApp', 'Endereço', 'Cidade', 'Estado', 'CEP', 'Observações', 'Data de Criação']);

            // Loop por cada segurado cadastrado para preencher as linhas
            foreach ($segurados as $segurado) {
                fputcsv($file, [
                    $segurado->id,
                    $segurado->nome_completo,
                    $segurado->cpf_cnpj,
                    $segurado->telefone_fixo,
                    $segurado->celular_whatsapp,
                    $segurado->endereco,
                    $segurado->cidade,
                    $segurado->estado,
                    $segurado->cep,
                    $segurado->observacoes,
                    $segurado->created_at->format('d/m/Y H:i')
                ]);
            }

            fclose($file);
        };

        // 5. Retorna o arquivo gerado em formato de fluxo (stream) para o usuário baixar
        return response()->stream($callback, 200, $headers);
    }
}
