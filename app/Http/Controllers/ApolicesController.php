<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreApoliceRequest;
use App\Http\Requests\UpdateApoliceRequest;
use App\Services\Apolice\ApoliceService;
use App\Services\Exportacoes\ExportacaoApoliceService;
use Illuminate\Http\Request;

class ApolicesController extends Controller
{
    // 1. Declarar service como propriedade
    protected ApoliceService $apoliceService;

    // 2. Injetar a dependencia por meio do construtor
    public function __construct(ApoliceService $apoliceService)
    {
        // 3. Atribuir a propriedade a instancia do service
        // significa que a propriedade $apoliceService da classe ApolicesController vai receber a instancia do ApoliceService que foi injetada pelo construtor
        // ou seja essa classe tem acesso a todos os dados e funções do service, e pode usar ele para realizar as operações relacionadas a apolices, como cadastrar, buscar, etc
        $this->apoliceService = $apoliceService;
    }

    // 3. Usar o service no método store
    public function store(StoreApoliceRequest $request)
    {
        // Aqui a gente pega os dados do request, valida eles e depois chama o método store do service passando os dados validados
        try {
            $data = $request->validated();
            $this->apoliceService->store($data);

            return redirect()->back()->with('success', 'Apólice cadastrada com sucesso!');
        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'Erro ao cadastrar apólice: '.$e->getMessage());
        }
    }

    public function destroy(Request $request, int $id)
    {
        // Exige a senha do usuário logado antes de cancelar a apólice — ação
        // com peso legal (Lei 15.040/2024, art. 21) e de único passo pra
        // desfazer. current_password é uma regra nativa do Laravel: valida
        // contra o hash do usuário autenticado no guard padrão, sem precisar
        // comparar hash manualmente aqui. Protege tanto o clique sem querer
        // quanto uma sessão esquecida aberta sendo usada por outra pessoa.
        $request->validate([
            'senha' => ['required', 'current_password'],
        ], [
            'senha.required' => 'Digite sua senha para confirmar a exclusão.',
            'senha.current_password' => 'Senha incorreta.',
        ]);

        try {
            $this->apoliceService->destroy($id);

            return redirect()->back()->with('success', 'Apólice excluída com sucesso!');
        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'Erro ao excluir apólice: '.$e->getMessage());
        }
    }

    public function update(UpdateApoliceRequest $request, int $id)
    {
        try {
            $data = $request->validated();
            $this->apoliceService->update($id, $data);

            return redirect()->back()->with('success', 'Apólice atualizada com sucesso!');
        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'Erro ao atualizar apólice: '.$e->getMessage());
        }
    }

    public function updateRamo(Request $request, int $id)
    {
        $request->validate([
            'novo_ramo_id' => 'required|integer|exists:ramos,id',
        ]);
        $ramoId = $request->input('novo_ramo_id');
        try {
            $this->apoliceService->AlterarRamo($id, $ramoId);

            return redirect()->back()->with('success', 'Ramo da apólice atualizado com sucesso!');
        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'Erro ao atualizar ramo da apólice: '.$e->getMessage());
        }
    }

    public function index(Request $request)
    {
        // Passa a request inteira ou os filtros para o service
        $segurados = $this->apoliceService->buscar();
        $total = $this->apoliceService->count();

        // Ativa = apólice com vigência cobrindo hoje (mesmo scopeAtivas
        // já usado no dashboard). Inativa = todo o resto (a iniciar ou vencida).
        $totalAtivas = $this->apoliceService->contarAtivas();
        $totalInativas = $total - $totalAtivas;

        $seguradoras = $this->apoliceService->buscarSeguradoras();
        $ramos = $this->apoliceService->buscarRamos();

        // Passamos o $request->all() para o service filtrar
        $apolices = $this->apoliceService->buscarApolices($request->all());

        return inertia('FunctionsApp/apolices', [
            'segurados' => $segurados,
            'total' => $total,
            'totalAtivas' => $totalAtivas,
            'totalInativas' => $totalInativas,
            'seguradoras' => $seguradoras,
            'ramos' => $ramos,
            'apolices' => $apolices,
            'filters' => $request->only(['busca', 'status']),
        ]);
    }

    public function ativar(int $id)
    {
        try {
            $this->apoliceService->ativar($id);

            return redirect()->back()->with('success', 'Apólice ativada com sucesso!');
        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'Não foi possível ativar a apólice.');
        }
    }

    public function renovar(Request $request, int $id)
    {
        $data = $request->validate([
            'numero_apolice' => 'required|string|max:100|unique:apolices,numero_apolice',
            'inicio_vigencia' => 'required|date',
            'fim_vigencia' => 'required|date|after:inicio_vigencia',
            'valor_premio_total' => 'required|numeric|min:0.01',
            'valor_cobertura' => 'nullable|numeric|min:0',
            'quantidade_parcelas' => 'required|integer|min:1|max:60',
        ]);

        try {
            $novaApolice = $this->apoliceService->renovar($id, $data);

            return redirect()->back()->with('success', "Apólice renovada com sucesso! Nova apólice #{$novaApolice->numero_apolice} criada.");
        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'Erro ao renovar apólice: '.$e->getMessage());
        }
    }

    public function restaurar(int $id)
    {
        try {
            $this->apoliceService->restore($id);

            return redirect()->back()->with('success', 'Apólice restaurada com sucesso!');
        } catch (\Exception $e) {
            return redirect()->back()->with('error', $e->getMessage());
        }
    }

    public function exportar(ExportacaoApoliceService $exportacaoService)
    {
        return $exportacaoService->exportarApolicesCsv();
    }
}
