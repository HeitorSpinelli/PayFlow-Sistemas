<?php

namespace App\Services\Exportacoes;

use App\Models\Apolice;
use App\Models\Pagamento;
use App\Models\Parcelas;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ExportacaoPagamentoService
{
    use EscreveLinhaCsv;

    // StreamedResponse cria um fluxo de dados direto para o navegador baixar sem ocupar memória do servidor
    public function exportarPagamentosCsv(): StreamedResponse
    {
        // Nome do arquivo = pagamentos + data atual + extensão .csv
        $fileName = 'Pagamentos-'.date('Y-m-d').'.csv';

        // A consulta é montada aqui mas só é EXECUTADA dentro do callback,
        // via cursor(). Com ->get() o streaming não servia de nada: os
        // registros já estavam todos na memória antes da resposta começar.
        $consulta = Pagamento::with(['apolice.cliente']);

        // Cabeçalhos HTTP para o navegador identificar o arquivo CSV
        $headers = [
            'Content-type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => "attachment; filename=$fileName",
            'Pragma' => 'no-cache',
            'Cache-Control' => 'must-revalidate, post-check=0, pre-check=0',
            'Expires' => '0',
        ];

        // Callback monta o arquivo CSV linha por linha
        $callback = function () use ($consulta) {
            // Abre um ponteiro de escrita direto para a saída do PHP
            $file = fopen('php://output', 'w');

            // Adiciona o BOM do UTF-8 para o Excel reconhecer acentos e caracteres especiais
            fprintf($file, chr(0xEF).chr(0xBB).chr(0xBF));

            // Cabeçalhos das colunas correspondentes à tabela do banco
            $this->escreverLinha($file, [
                'ID',
                'Cliente',
                'Apólice',
                'Parcela',
                'Valor',
                'Data do Pagamento',
                'Forma de Pagamento',
                'Status',
                'Observações',
                'Data de Criação',
            ]);

            // Percorre cada pagamento para preencher as linhas do CSV
            // cursor() traz uma linha por vez do Postgres em vez de hidratar
            // a coleção inteira — memória constante, independente do volume.
            foreach ($consulta->cursor() as $pagamento) {
                $this->escreverLinha($file, [
                    $pagamento->id,
                    $pagamento->apolice->cliente->nome_completo ?? 'Não informado', // Pega do relacionamento
                    $pagamento->apolice->numero_apolice ?? 'Não informado', // Pega do relacionamento
                    $pagamento->parcela,
                    $pagamento->valor,
                    $pagamento->data_pagamento ? date('d/m/Y', strtotime($pagamento->data_pagamento)) : '',
                    $pagamento->forma_pagamento,
                    $pagamento->status,
                    $pagamento->observacoes,
                    $pagamento->created_at ? $pagamento->created_at->format('d/m/Y H:i') : '',
                ]);
            }

            // Fecha o ponteiro do arquivo
            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }

    /**
     * Exporta as parcelas de UMA apólice específica — é a mesma lista
     * mostrada no modal de detalhes do pagamento ("Parcelas da apólice"),
     * já filtrada pela apólice que está selecionada no dropdown naquele
     * momento (o cliente pode ter outras apólices, mas só a selecionada
     * entra no arquivo). Diferente de exportarPagamentosCsv() acima, que só
     * traz pagamentos JÁ CONFIRMADOS de todo mundo — aqui entra parcela em
     * aberto e a vencer também, porque é isso que o operador vê no modal.
     */
    public function exportarPagamentosApoliceCsv(int $apoliceId): StreamedResponse
    {
        $apolice = Apolice::with('cliente')->findOrFail($apoliceId);

        $fileName = 'Pagamentos-'.Str::slug($apolice->numero_apolice).'-'.date('Y-m-d').'.csv';

        $parcelas = Parcelas::where('apolice_id', $apoliceId)
            ->orderBy('numero_parcela')
            ->get();

        $headers = [
            'Content-type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => "attachment; filename=$fileName",
            'Pragma' => 'no-cache',
            'Cache-Control' => 'must-revalidate, post-check=0, pre-check=0',
            'Expires' => '0',
        ];

        $callback = function () use ($parcelas, $apolice) {
            $file = fopen('php://output', 'w');

            fprintf($file, chr(0xEF).chr(0xBB).chr(0xBF));

            $this->escreverLinha($file, [
                'Apólice',
                'Cliente',
                'Parcela',
                'Valor',
                'Data',
                'Status',
            ]);

            foreach ($parcelas as $parcela) {
                $paga = $parcela->status_pagamento === 'paga';
                // Mesma regra usada no modal do frontend: atrasada é a que
                // não está paga e já passou do vencimento (Parcelas::diasEmAtraso()).
                $atrasada = ! $paga && $parcela->diasEmAtraso() > 0;
                $data = $paga ? $parcela->data_pagamento : $parcela->data_vencimento;

                $this->escreverLinha($file, [
                    $apolice->numero_apolice,
                    $apolice->cliente->nome_completo ?? 'Não informado',
                    $parcela->numero_parcela.'ª',
                    $parcela->valor_parcela,
                    $data ? date('d/m/Y', strtotime($data)) : '',
                    $paga ? 'Paga' : ($atrasada ? 'Atrasada' : 'A vencer'),
                ]);
            }

            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }
}
