<?php

namespace App\Services\Financeiro;

use App\Models\IndicadorEconomico;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class IndicadorEconomicoService
{
    // Códigos das séries no Sistema Gerenciador de Séries Temporais (SGS) do
    // Banco Central. 432 = Meta Selic definida pelo Copom (% ao ano).
    // 433 = IPCA, variação percentual MENSAL (não é o acumulado em 12 meses).
    private const CODIGO_SELIC = 432;
    private const CODIGO_IPCA_MENSAL = 433;

    private const URL_BASE = 'https://api.bcb.gov.br/dados/serie/bcdata.sgs';

    /**
     * Atualiza os dois indicadores (Selic e IPCA acumulado 12m).
     * Cada um é buscado/salvo de forma independente: se um falhar,
     * isso não impede o outro de ser atualizado com sucesso.
     */
    public function atualizarTodos(): void
    {
        $this->atualizarSelic();
        $this->atualizarIpca12Meses();
    }

    /**
     * Busca a Meta Selic mais recente na API do BCB e salva um novo
     * registro. Se a API falhar, apenas loga o erro e não salva nada —
     * o sistema continua usando o último valor já salvo (fallback natural,
     * já que obterUltimoValor() sempre pega o registro mais recente).
     */
    public function atualizarSelic(): void
    {
        try {
            $resposta = Http::timeout(10)->get(
                self::URL_BASE . '.' . self::CODIGO_SELIC . '/dados/ultimos/1?formato=json'
            );

            if ($resposta->failed()) {
                throw new \Exception('BCB respondeu com erro: ' . $resposta->status());
            }

            $dados = $resposta->json();

            if (empty($dados)) {
                throw new \Exception('BCB não retornou nenhum valor para a série Selic.');
            }

            $ultimo = $dados[0]; // formato: ['data' => 'dd/MM/yyyy', 'valor' => 'x.xx']

            IndicadorEconomico::create([
                'indicador' => 'selic',
                'valor' => (float) $ultimo['valor'],
                'data_referencia' => Carbon::createFromFormat('d/m/Y', $ultimo['data']),
                'atualizado_em' => now(),
            ]);
        } catch (\Exception $e) {
            // Não relança a exceção — uma falha aqui não deve derrubar
            // o resto do sistema. Só registra no log para investigação.
            Log::warning('Falha ao atualizar Selic via API do BCB: ' . $e->getMessage());
        }
    }

    /**
     * Busca os últimos 12 valores MENSAIS do IPCA e calcula o acumulado
     * em 12 meses, compondo os percentuais (juros compostos), que é a
     * forma correta de comparar com uma taxa anual como a Selic.
     *
     * Exemplo do cálculo: se os 3 primeiros meses (de 12) tiveram
     * 0,5%, 0,3% e 0,4%, o fator acumulado começa em 1.0 e vai
     * multiplicando: 1.0 × 1.005 × 1.003 × 1.004 ... até os 12 meses.
     * O resultado final, menos 1, e multiplicado por 100, é o
     * percentual acumulado real (não a soma simples dos 12 valores,
     * que subestimaria o efeito composto).
     */
    public function atualizarIpca12Meses(): void
    {
        try {
            $resposta = Http::timeout(10)->get(
                self::URL_BASE . '.' . self::CODIGO_IPCA_MENSAL . '/dados/ultimos/12?formato=json'
            );

            if ($resposta->failed()) {
                throw new \Exception('BCB respondeu com erro: ' . $resposta->status());
            }

            $dados = $resposta->json();

            if (count($dados) < 12) {
                throw new \Exception('BCB retornou menos de 12 valores mensais de IPCA.');
            }

            $fatorAcumulado = 1.0;
            foreach ($dados as $mes) {
                $valorMensal = (float) $mes['valor'];
                $fatorAcumulado *= (1 + ($valorMensal / 100));
            }
            $ipcaAcumulado12Meses = ($fatorAcumulado - 1) * 100;

            $dataMaisRecente = end($dados);

            IndicadorEconomico::create([
                'indicador' => 'ipca_12m',
                'valor' => round($ipcaAcumulado12Meses, 4),
                'data_referencia' => Carbon::createFromFormat('d/m/Y', $dataMaisRecente['data']),
                'atualizado_em' => now(),
            ]);
        } catch (\Exception $e) {
            Log::warning('Falha ao atualizar IPCA via API do BCB: ' . $e->getMessage());
        }
    }

    /**
     * Retorna o valor mais recente já salvo de um indicador
     * ('selic' ou 'ipca_12m'). Não faz nenhuma chamada à API — só
     * consulta o banco. É essa consulta que naturalmente implementa
     * o fallback "usa a última taxa registrada": se hoje a atualização
     * falhou, o registro mais recente ainda é o de ontem (ou de quando
     * foi o último sucesso), e é isso que essa função devolve.
     */
    public function obterUltimoValor(string $indicador): ?float
    {
        $registro = IndicadorEconomico::where('indicador', $indicador)
            ->orderByDesc('atualizado_em')
            ->first();

        return $registro?->valor;
    }

    /**
     * Calcula a taxa legal de juros de mora, conforme art. 406 do
     * Código Civil (redação dada pela Lei 14.905/2024): Selic
     * deduzido o IPCA acumulado em 12 meses.
     *
     * Retorna null se algum dos dois indicadores nunca foi buscado
     * com sucesso ainda (ex: sistema recém-implantado, antes da
     * primeira execução do comando agendado).
     */
    public function calcularTaxaLegalMora(): ?float
    {
        $selic = $this->obterUltimoValor('selic');
        $ipca12m = $this->obterUltimoValor('ipca_12m');

        if ($selic === null || $ipca12m === null) {
            return null;
        }

        return round($selic - $ipca12m, 4);
    }
}