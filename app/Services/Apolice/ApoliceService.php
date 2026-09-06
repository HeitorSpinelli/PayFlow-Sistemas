<?php

namespace App\Services\Apolice;

use App\Models\Apolice;
use App\Models\BeneficiarioApolice;
use App\Models\DadosEmpresarialApolice;
use App\Models\DadosResidenciaApolice;
use App\Models\DadosVeiculoApolice;
use App\Models\DadosVidaApolice;
use App\Models\Pagamento;
use App\Models\Parcelas;
use App\Models\Ramo;
use App\Models\Segurado;
use App\Models\Seguradora;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class ApoliceService
{
    private const MESES_ABREV = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

    public function store(array $data)
    {
        try {
            // DB::transaction: se a criação de alguma parcela (ou dos dados
            // extras de veículo/residência) falhar no meio do loop, a apólice
            // criada no início não fica "órfã" sem as parcelas esperadas.
            DB::transaction(function () use ($data) {
                // Cria a apólice
                $apolice = Apolice::create($data);

                // Calcula o valor de cada parcela
                $quantidadeParcelas = $data['quantidade_parcelas'];
                $valorParcela = round($data['valor_premio_total'] / $quantidadeParcelas, 2);

                // Data base para calcular vencimentos (30 dias após início da vigência)
                $dataBase = Carbon::parse($data['inicio_vigencia']);

                // Cria cada parcela automaticamente
                for ($i = 1; $i <= $quantidadeParcelas; $i++) {
                    // A última parcela absorve a diferença do arredondamento (ex:
                    // R$1000 / 3 = R$333,33 x3 = R$999,99, faltando 1 centavo) —
                    // sem isso, a soma das parcelas nunca bate com o prêmio total.
                    $valorDestaParcela = $i === $quantidadeParcelas
                        ? round($data['valor_premio_total'] - ($valorParcela * ($quantidadeParcelas - 1)), 2)
                        : $valorParcela;

                    Parcelas::create([
                        'apolice_id' => $apolice->id,
                        'numero_parcela' => $i,
                        'valor_parcela' => $valorDestaParcela,
                        'data_vencimento' => $dataBase->copy()->addMonthsNoOverflow($i),
                        'status_pagamento' => 'em_aberto',
                    ]);
                }

                // Dados extras exigidos conforme a categoria do ramo. Decide pela
                // categoria real do ramo (não só pela chave existir no payload):
                // o frontend sempre manda todos os blocos, então isset() sozinho
                // criaria um registro de veículo vazio numa apólice residencial.
                $ramo = Ramo::find($data['ramo_id']);
                $this->criarDadosExtras($apolice, $data, $ramo?->categoria);
            });
        } catch (\Exception $e) {
            throw new \Exception('Erro ao cadastrar apólice: '.$e->getMessage());
        }
    }

    /**
     * Cria o registro extra (veículo/residência/vida+beneficiários/
     * empresarial) correspondente à categoria do ramo — usado só na criação,
     * onde ainda não existe nenhum registro extra prévio pra essa apólice.
     */
    private function criarDadosExtras(Apolice $apolice, array $data, ?string $categoria): void
    {
        if ($categoria === Ramo::CATEGORIA_VEICULO && isset($data['veiculo'])) {
            DadosVeiculoApolice::create([...$data['veiculo'], 'apolice_id' => $apolice->id]);
        } elseif ($categoria === Ramo::CATEGORIA_RESIDENCIAL && isset($data['residencia'])) {
            DadosResidenciaApolice::create([...$data['residencia'], 'apolice_id' => $apolice->id]);
        } elseif ($categoria === Ramo::CATEGORIA_VIDA && isset($data['vida'])) {
            DadosVidaApolice::create([...$data['vida'], 'apolice_id' => $apolice->id]);

            foreach ($data['beneficiarios'] ?? [] as $beneficiario) {
                BeneficiarioApolice::create([...$beneficiario, 'apolice_id' => $apolice->id]);
            }
        } elseif ($categoria === Ramo::CATEGORIA_EMPRESARIAL && isset($data['empresarial'])) {
            DadosEmpresarialApolice::create([...$data['empresarial'], 'apolice_id' => $apolice->id]);
        }
    }

    // Função para buscar os segurados cadastrados no banco, selecionando apenas os campos id, nome_completo e cpf_cnpj
    public function buscar()
    {
        try {
            return Segurado::select('id', 'nome_completo', 'cpf_cnpj')->get();
        } catch (\Exception $e) {
            throw new \Exception('Erro ao buscar segurados: '.$e->getMessage());
        }
    }

    public function buscarSeguradoras()
    {
        try {
            return Seguradora::select('id', 'nome_fantasia')->get();
        } catch (\Exception $e) {
            throw new \Exception('Erro ao buscar seguradoras: '.$e->getMessage());
        }
    }

    public function buscarRamos()
    {
        try {
            return Ramo::select('id', 'nome_ramo', 'categoria', 'seguradora_id')->get();
        } catch (\Exception $e) {
            throw new \Exception('Erro ao buscar ramos: '.$e->getMessage());
        }
    }

    public function buscarApolices(array $filters = [])
    {
        try {
            $query = Apolice::query()
                ->with(['dadosVeiculo', 'dadosResidencia', 'dadosVida', 'beneficiarios', 'dadosEmpresarial'])
                ->join('segurados', 'apolices.cliente_id', '=', 'segurados.id')
                ->join('ramos', 'apolices.ramo_id', '=', 'ramos.id')
                ->join('seguradoras', 'apolices.seguradora_id', '=', 'seguradoras.id')
                ->select(
                    'apolices.id',
                    'apolices.numero_apolice',
                    'apolices.valor_premio_total',
                    'apolices.quantidade_parcelas',
                    'apolices.inicio_vigencia',
                    'apolices.fim_vigencia',
                    'apolices.valor_cobertura',
                    'apolices.forma_pagamento',
                    'segurados.nome_completo',
                    'segurados.cpf_cnpj',
                    'ramos.nome_ramo',
                    'ramos.categoria as ramo_categoria',
                    'segurados.id as cliente_id',
                    'ramos.id as ramo_id',
                    'seguradoras.id as seguradora_id',
                    'seguradoras.nome_fantasia'
                );

            if (! empty($filters['busca'])) {
                $termo = $filters['busca'];

                $query->where(function ($q) use ($termo) {
                    // Busca na própria apólice
                    $q->where('apolices.numero_apolice', 'ilike', "%{$termo}%")
                        // Ou busca direto no cliente dono da apólice usando a relação e o ilike do Postgres
                        ->orWhereHas('cliente', function ($qCliente) use ($termo) {
                            $qCliente->where('nome_completo', 'ilike', "%{$termo}%")
                                ->orWhere('cpf_cnpj', 'ilike', "%{$termo}%");
                        })
                        // Ou nos ramos e seguradoras
                        ->orWhere('ramos.nome_ramo', 'ilike', "%{$termo}%")
                        ->orWhere('seguradoras.nome_fantasia', 'ilike', "%{$termo}%");
                });
            }

            if (! empty($filters['status']) && $filters['status'] !== 'Todos') {
                $status = $filters['status'];

                if ($status === 'Vigente') {
                    $query->where('apolices.inicio_vigencia', '<=', now())
                        ->where('apolices.fim_vigencia', '>=', now());
                } elseif ($status === 'A Iniciar') {
                    $query->where('apolices.inicio_vigencia', '>', now());
                } elseif ($status === 'Para Renovar') {
                    $query->where('apolices.fim_vigencia', '<', now());
                }
            }

            return $query->paginate(10)->withQueryString();
        } catch (\Exception $e) {
            throw new \Exception('Erro ao buscar apólices: '.$e->getMessage());
        }
    }

    public function destroy(int $id)
    {
        try {
            DB::transaction(function () use ($id) {
                $apolice = Apolice::findOrFail($id);
                foreach ($apolice->parcelas as $parcela) {
                    $parcela->delete();
                }
                foreach ($apolice->pagamentos as $pagamento) {
                    $pagamento->delete();
                }
                $apolice->delete();
            });
        } catch (\Exception $e) {
            throw new \Exception('Erro ao excluir apólice: '.$e->getMessage());
        }
    }

    public function update(int $id, array $data)
    {
        try {
            DB::transaction(function () use ($id, $data) {
                $apolice = Apolice::findOrFail($id);
                $apolice->update($data);

                // Mesma decisão pela categoria real do ramo usada em store(). Se o
                // ramo da apólice mudou de categoria na edição (ex: veículo ->
                // residencial), o registro extra do tipo antigo é removido para
                // não ficar um dado de veículo órfão numa apólice residencial.
                $ramo = Ramo::find($apolice->ramo_id);

                if ($ramo?->categoria === Ramo::CATEGORIA_VEICULO && isset($data['veiculo'])) {
                    DadosVeiculoApolice::updateOrCreate(['apolice_id' => $apolice->id], $data['veiculo']);
                } elseif ($ramo?->categoria === Ramo::CATEGORIA_RESIDENCIAL && isset($data['residencia'])) {
                    DadosResidenciaApolice::updateOrCreate(['apolice_id' => $apolice->id], $data['residencia']);
                } elseif ($ramo?->categoria === Ramo::CATEGORIA_VIDA && isset($data['vida'])) {
                    DadosVidaApolice::updateOrCreate(['apolice_id' => $apolice->id], $data['vida']);

                    // Substitui a lista inteira de beneficiários pela enviada — mais
                    // simples e seguro do que tentar casar quem mudou/entrou/saiu.
                    BeneficiarioApolice::where('apolice_id', $apolice->id)->delete();
                    foreach ($data['beneficiarios'] ?? [] as $beneficiario) {
                        BeneficiarioApolice::create([...$beneficiario, 'apolice_id' => $apolice->id]);
                    }
                } elseif ($ramo?->categoria === Ramo::CATEGORIA_EMPRESARIAL && isset($data['empresarial'])) {
                    DadosEmpresarialApolice::updateOrCreate(['apolice_id' => $apolice->id], $data['empresarial']);
                }

                $this->limparDadosDaCategoriaErrada($apolice, $ramo?->categoria);
            });
        } catch (\Exception $e) {
            throw new \Exception('Erro ao atualizar apólice: '.$e->getMessage());
        }
    }

    /**
     * Remove o registro extra (veículo/residência/vida+beneficiários/
     * empresarial) que não corresponde mais à categoria válida informada.
     * Usado tanto por update() quanto por AlterarRamo() — os dois pontos
     * onde o ramo de uma apólice pode mudar.
     */
    private function limparDadosDaCategoriaErrada(Apolice $apolice, ?string $categoriaValida): void
    {
        if ($categoriaValida !== Ramo::CATEGORIA_VEICULO) {
            DadosVeiculoApolice::where('apolice_id', $apolice->id)->delete();
        }

        if ($categoriaValida !== Ramo::CATEGORIA_RESIDENCIAL) {
            DadosResidenciaApolice::where('apolice_id', $apolice->id)->delete();
        }

        if ($categoriaValida !== Ramo::CATEGORIA_VIDA) {
            DadosVidaApolice::where('apolice_id', $apolice->id)->delete();
            BeneficiarioApolice::where('apolice_id', $apolice->id)->delete();
        }

        if ($categoriaValida !== Ramo::CATEGORIA_EMPRESARIAL) {
            DadosEmpresarialApolice::where('apolice_id', $apolice->id)->delete();
        }
    }

    // Função para contar o total de apolices cadastradas no banco
    public function count()
    {
        try {
            return Apolice::count();
        } catch (\Exception $e) {
            throw new \Exception('Erro ao contar apólices: '.$e->getMessage());
        }
    }

    public function AlterarRamo(int $apoliceId, int $novoRamoId)
    {
        try {
            DB::transaction(function () use ($apoliceId, $novoRamoId) {
                $apolice = Apolice::findOrFail($apoliceId);
                $apolice->ramo_id = $novoRamoId;
                $apolice->save();

                // Esse endpoint só recebe o novo ramo, sem dados de veículo/
                // residência — não tem como "inventar" a placa ou o endereço do
                // imóvel novo. Por isso só limpa o que não bate mais com a nova
                // categoria; o usuário preenche os dados corretos depois, pela
                // edição normal da apólice.
                $novoRamo = Ramo::find($novoRamoId);
                $this->limparDadosDaCategoriaErrada($apolice, $novoRamo?->categoria);
            });
        } catch (\Exception $e) {
            throw new \Exception('Erro ao alterar o ramo da apólice: '.$e->getMessage());
        }
    }

    // Listando apenas clientes que estão com deleted at
    public function listarInativos()
    {
        return Apolice::onlyTrashed()->get();
    }

    // Restaura o segurado pelo id
    public function restore(int $id)
    {
        try {
            DB::transaction(function () use ($id) {
                $apolice = Apolice::withTrashed()->findOrFail($id);
                $apolice->restore();
                $parcelas = $apolice->parcelas()->onlyTrashed()->get();
                foreach ($parcelas as $parcela) {
                    $parcela->restore();
                }
                $pagamentos = $apolice->pagamentos()->onlyTrashed()->get();
                foreach ($pagamentos as $pagamento) {
                    $pagamento->restore();
                }
            });
        } catch (\Exception $e) {
            throw new \Exception('Erro ao restaurar segurado: '.$e->getMessage());
        }
    }

    public function contarClientesDevedores()
    {
        return Segurado::whereHas('apolices.parcelas', function ($query) {
            $query->where('status_pagamento', 'em_aberto')
                ->where('data_vencimento', '<', now());
        })->count();
    }

    public function receitaDoMes()
    {
        return Pagamento::where('status', 'confirmado')
            ->whereMonth('data_pagamento', now()->month)
            ->whereYear('data_pagamento', now()->year)
            ->sum('valor');
    }

    public function contarAtivas()
    {
        return Apolice::ativas()->count();
    }

    /**
     * Parcelas em aberto que já venceram (atrasadas) ou que vencem nos
     * próximos $diasLimite dias — usado no card "Vencimentos próximos"
     * do dashboard. Prioriza as mais urgentes primeiro (data de
     * vencimento mais próxima/mais atrasada), limitado a $limite itens.
     */
    public function vencimentosProximos(int $diasLimite = 15, int $limite = 10): array
    {
        $hoje = now()->startOfDay();
        $dataLimite = $hoje->copy()->addDays($diasLimite);

        $parcelas = Parcelas::with(['apolice.cliente'])
            ->where('status_pagamento', '!=', 'paga')
            ->where('data_vencimento', '<=', $dataLimite)
            ->orderBy('data_vencimento')
            ->limit($limite)
            ->get();

        return $parcelas->map(function ($parcela) use ($hoje) {
            $vencimento = Carbon::parse($parcela->data_vencimento)->startOfDay();
            $dias = $hoje->diffInDays($vencimento, false);

            return [
                'id' => $parcela->id,
                'cliente' => $parcela->apolice->cliente->nome_completo ?? 'Cliente não encontrado',
                'apolice' => $parcela->apolice->numero_apolice ?? 'N/A',
                'valor' => (float) $parcela->valor_parcela,
                'dias' => (int) abs($dias),
                'status' => $dias < 0 ? 'atrasado' : 'pendente',
            ];
        })->toArray();
    }

    /**
     * Receita (soma de pagamentos confirmados) agrupada por mês,
     * para os últimos $meses meses, incluindo o mês atual (parcial).
     * Meses sem nenhum pagamento aparecem com valor 0, não somem do array.
     */
    public function receitaUltimosMeses(int $meses = 6): array
    {
        // copy() evita que a variável original seja alterada se ela for reaproveitada mais adiante,
        // hábito defensivo, já que Carbon é mutável
        // $months - 1 é para contar incluindo o mes atual, como serão 6, é 6 - 1 = 5,
        // se hoje é junho aparece junho - 5 meses janeiro
        // zera o primeiro dia do mês as 00:00.
        $inicio = now()->copy()->subMonths($meses - 1)->startOfMonth();

        // Consulta para trazer pagamentos confirmado, com data de pagamento,
        // maior ou igual a $inicio ou seja dentro dos 6 meses
        // TO_CHAR usado para transformar data em texto no formato que quiser
        // soma o valor como total e agrupa por chave, pluck devolve uma coleção e nn array,
        $porMes = Pagamento::where('status', 'confirmado')
            ->where('data_pagamento', '>=', $inicio)
            ->selectRaw("TO_CHAR(data_pagamento, 'YYYY-MM') as chave, SUM(valor) as total")
            ->groupBy('chave')
            ->pluck('total', 'chave');

        // resultado array vazio
        // para cada mês da janela, incluindo o atual (quando $i = 0), cria $data e $chave,
        // e busca o valor correspondente em $porMes
        // resultado onde era array vazio passa a receber array de mes e valor abreviados
        $resultado = [];
        for ($i = $meses - 1; $i >= 0; $i--) {
            $data = now()->copy()->startOfMonth()->subMonths($i);
            $chave = $data->format('Y-m');

            $resultado[] = [
                'mes' => self::MESES_ABREV[$data->month - 1],
                'valor' => (float) ($porMes[$chave] ?? 0),
            ];
        }

        return $resultado;
    }

    /**
     * Quantidade de apólices agrupada por ramo (tipo de seguro),
     * somando todas as seguradoras juntas — para o gráfico de pizza.
     */
    public function distribuicaoPorRamo(): array
    {
        return Apolice::join('ramos', 'apolices.ramo_id', '=', 'ramos.id')
            ->selectRaw('ramos.nome_ramo as tipo, COUNT(*) as total')
            ->groupBy('ramos.nome_ramo')
            ->orderByDesc('total')
            ->get()
            ->toArray();
    }
}
