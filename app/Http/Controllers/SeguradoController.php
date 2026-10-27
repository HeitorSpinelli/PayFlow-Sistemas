<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreSeguradoRequest;
use App\Http\Requests\UpdateSeguradoRequest;
use App\Models\Segurado;
use App\Services\Cliente\SeguradoService;
use App\Services\Exportacoes\ExportacaoSeguradosService;
use Illuminate\Http\Request;

class SeguradoController extends Controller
{
    // 1. Declaração do service como propriedade
    protected SeguradoService $seguradoService;

    // 2. Injeta pelo construtor
    public function __construct(SeguradoService $seguradoService)
    {
        $this->seguradoService = $seguradoService;
    }

    // 3. Usa no store
    public function store(StoreSeguradoRequest $request)
    {
        try {
            $data = $request->validated();
            $this->seguradoService->store($data);

            return redirect()->back()->with('success', 'Segurado cadastrado com sucesso!');
        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'Erro ao cadastrar segurado: '.$e->getMessage());
        }
    }

    public function show(Request $request)
    {
        $segurados = Segurado::with('apolices')
            ->filter($request->all())
            ->paginate(10)
            ->withQueryString();

        $total = Segurado::count();

        // Ativo = tem pelo menos uma apólice DENTRO da vigência
        $totalAtivos = Segurado::whereHas('apolices', function ($q) {
            $q->ativas();
        })->count();
        $totalInativos = Segurado::whereDoesntHave('apolices', function ($q) {
            $q->ativas();
        })->count();

        return inertia('FunctionsApp/clientes', [
            'segurados' => $segurados,
            'total' => $total,
            'totalAtivos' => $totalAtivos,
            'totalInativos' => $totalInativos,
        ]);
    }

    public function destroy(int $id)
    {
        try {
            $this->seguradoService->destroy($id);

            return redirect()->back()->with('success', 'Segurado excluído com sucesso!');
        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'Erro ao excluir segurado: '.$e->getMessage());
        }
    }

    public function update(UpdateSeguradoRequest $request, int $id)
    {
        try {
            $data = $request->validated();
            $this->seguradoService->update($id, $data);

            return redirect()->back()->with('success', 'Segurado atualizado com sucesso!');
        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'Erro ao atualizar segurado: '.$e->getMessage());
        }
    }

    public function restaurar(int $id)
    {
        try {
            $this->seguradoService->restore($id);

            return redirect()->back()->with('success', 'Segurado Reativado Com Sucesso');
        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'Não foi possivel reativar o segurado');
        }
    }

    public function ficha(int $id)
    {
        // Página Blade simples (não Inertia), aberta numa aba própria e já
        // pronta para impressão — mesmo esquema do cupom de parcela.
        $segurado = Segurado::with([
            'apolices' => fn ($q) => $q->orderByDesc('fim_vigencia'),
            'apolices.seguradora',
            'apolices.ramo',
            'apolices.parcelas',
        ])->findOrFail($id);

        // Mesma regra de status de parcela do CSV e do cupom: atrasada é a
        // não paga com vencimento já passado.
        $apolices = $segurado->apolices->map(function ($apolice) {
            $pagas = $apolice->parcelas->where('status_pagamento', 'paga')->count();
            $atrasadas = $apolice->parcelas
                ->filter(fn ($p) => $p->status_pagamento !== 'paga' && $p->diasEmAtraso() > 0)
                ->count();

            return [
                'numero' => $apolice->numero_apolice,
                'seguradora' => $apolice->seguradora->nome_fantasia ?? '—',
                'ramo' => $apolice->ramo->nome_ramo ?? '—',
                'inicio' => $apolice->inicio_vigencia,
                'fim' => $apolice->fim_vigencia,
                'status' => $apolice->status_vigencia,
                'premio' => (float) $apolice->valor_premio_total,
                'total_parcelas' => $apolice->quantidade_parcelas ?: $apolice->parcelas->count(),
                'pagas' => $pagas,
                'atrasadas' => $atrasadas,
            ];
        });

        return view('fichas.segurado', [
            'segurado' => $segurado,
            'apolices' => $apolices,
            'vigentes' => $apolices->where('status', 'Vigente')->count(),
            'atrasadas' => $apolices->sum('atrasadas'),
        ]);
    }

    public function exportar(ExportacaoSeguradosService $exportacaoService)
    {
        return $exportacaoService->exportarSeguradosCsv();
    }
}
