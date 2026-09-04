<?php

namespace App\Services\Apolice;

use App\Models\Apolice;
use App\Models\DadosResidenciaApolice;
use App\Models\DadosVeiculoApolice;
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
                $valorParcela = round($data['valor_premio_total'] / $data['quantidade_parcelas'], 2);

                // Data base para calcular vencimentos (30 dias após início da vigência)
                $dataBase = Carbon::parse($data['inicio_vigencia']);

                // Cria cada parcela automaticamente
                for ($i = 1; $i <= $data['quantidade_parcelas']; $i++) {
                    Parcelas::create([
                        'apolice_id' => $apolice->id,
                        'numero_parcela' => $i,
                        'valor_parcela' => $valorParcela,
                        'data_vencimento' => $dataBase->copy()->addMonthsNoOverflow($i),
                        'status_pagamento' => 'em_aberto',
                    ]);
                }

                // Dados extras exigidos conforme a categoria do ramo. Decide pela
                // categoria real do ramo (não só pela chave existir no payload):
                // o frontend sempre manda os dois blocos, então isset() sozinho
                // criaria um registro de veículo vazio numa apólice residencial.
                $ramo = Ramo::find($data['ramo_id']);

                if ($ramo?->categoria === Ramo::CATEGORIA_VEICULO && isset($data['veiculo'])) {
                    DadosVeiculoApolice::create([...$data['veiculo'], 'apolice_id' => $apolice->id]);
                } elseif ($ramo?->categoria === Ramo::CATEGORIA_RESIDENCIAL && isset($data['residencia'])) {
                    DadosResidenciaApolice::create([...$data['residencia'], 'apolice_id' => $apolice->id]);
                }
            });
        } catch (\Exception $e) {
            throw new \Exception('Erro ao cadastrar apólice: '.$e->getMessage());
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
                ->with(['dadosVeiculo', 'dadosResidencia'])
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

                $this->sincronizarParcelas($apolice, $data);

                // Mesma decisão pela categoria real do ramo usada em store(). Se o
                // ramo da apólice mudou de categoria na edição (ex: veículo ->
                // residencial), o registro extra do tipo antigo é removido para
                // não ficar um dado de veículo órfão numa apólice residencial.
                $ramo = Ramo::find($apolice->ramo_id);

                if ($ramo?->categoria === Ramo::CATEGORIA_VEICULO && isset($data['veiculo'])) {
                    DadosVeiculoApolice::updateOrCreate(['apolice_id' => $apolice->id], $data['veiculo']);
                    DadosResidenciaApolice::where('apolice_id', $apolice->id)->delete();
                } elseif ($ramo?->categoria === Ramo::CATEGORIA_RESIDENCIAL && isset($data['residencia'])) {
                    DadosResidenciaApolice::updateOrCreate(['apolice_id' => $apolice->id], $data['residencia']);
                    DadosVeiculoApolice::where('apolice_id', $apolice->id)->delete();
                } else {
                    DadosVeiculoApolice::where('apolice_id', $apolice->id)->delete();
                    DadosResidenciaApolice::where('apolice_id', $apolice->id)->delete();
                }
            });
        } catch (\Exception $e) {
            throw new \Exception('Erro ao atualizar apólice: '.$e->getMessage());
        }
    }

    // As parcelas só são geradas uma vez em store(). Se quantidade_parcelas ou
    // valor_premio_total mudam na edição, sincroniza a tabela parcelas com o
    // novo cronograma — sem nunca apagar ou reescrever uma parcela já paga.
    private function sincronizarParcelas(Apolice $apolice, array $data): void
    {
        $quantidadeParcelas = (int) $data['quantidade_parcelas'];
        $valorParcela = round($data['valor_premio_total'] / $quantidadeParcelas, 2);
        $dataBase = Carbon::parse($data['inicio_vigencia']);

        $parcelasExistentes = Parcelas::where('apolice_id', $apolice->id)
            ->orderBy('numero_parcela')
            ->get();

        foreach ($parcelasExistentes as $parcela) {
            if ($parcela->numero_parcela > $quantidadeParcelas) {
                // só remove parcela excedente se ela ainda não foi paga
                if ($parcela->status_pagamento !== 'paga') {
                    $parcela->delete();
                }

                continue;
            }

            // parcela paga mantém o valor histórico; só as pendentes acompanham o novo valor
            if ($parcela->status_pagamento !== 'paga') {
                $parcela->update(['valor_parcela' => $valorParcela]);
            }
        }

        $maiorNumeroExistente = $parcelasExistentes->max('numero_parcela') ?? 0;

        for ($i = $maiorNumeroExistente + 1; $i <= $quantidadeParcelas; $i++) {
            Parcelas::create([
                'apolice_id' => $apolice->id,
                'numero_parcela' => $i,
                'valor_parcela' => $valorParcela,
                'data_vencimento' => $dataBase->copy()->addMonthsNoOverflow($i),
                'status_pagamento' => 'em_aberto',
            ]);
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
            $apolice = Apolice::findOrFail($apoliceId);
            $apolice->ramo_id = $novoRamoId;
            $apolice->save();
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
                ->where('data_vencimento', '<', now()->startOfDay());
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
