<?php

namespace App\Services\Exportacoes;

use App\Models\Pagamento;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ExportacaoPagamentoService
{
    // StreamedResponse cria um fluxo de dados direto para o navegador baixar sem ocupar memória do servidor
    public function exportarPagamentosCsv(): StreamedResponse
    {
        // Nome do arquivo = pagamentos + data atual + extensão .csv
        $fileName = 'Pagamentos-' . date('Y-m-d') . '.csv';

        // Busca os pagamentos carregando os relacionamentos para trazer os nomes em vez dos IDs
        $pagamentos = Pagamento::with(['apolice.cliente'])->get();

        // Cabeçalhos HTTP para o navegador identificar o arquivo CSV
        $headers = [
            "Content-type"        => "text/csv; charset=UTF-8",
            "Content-Disposition" => "attachment; filename=$fileName",
            "Pragma"              => "no-cache",
            "Cache-Control"       => "must-revalidate, post-check=0, pre-check=0",
            "Expires"             => "0"
        ];

        // Callback monta o arquivo CSV linha por linha
        $callback = function () use ($pagamentos) {
            // Abre um ponteiro de escrita direto para a saída do PHP
            $file = fopen('php://output', 'w');

            // Adiciona o BOM do UTF-8 para o Excel reconhecer acentos e caracteres especiais
            fprintf($file, chr(0xEF) . chr(0xBB) . chr(0xBF));

            // Cabeçalhos das colunas correspondentes à tabela do banco
            fputcsv($file, [
                'ID',
                'Cliente',
                'Apólice',
                'Parcela',
                'Valor',
                'Data do Pagamento',
                'Forma de Pagamento',
                'Status',
                'Observações',
                'Data de Criação'
            ]);

            // Percorre cada pagamento para preencher as linhas do CSV
            foreach ($pagamentos as $pagamento) {
                fputcsv($file, [
                    $pagamento->id,
                    $pagamento->apolice->cliente->nome_completo ?? 'Não informado', // Pega do relacionamento
                    $pagamento->apolice->numero_apolice ?? 'Não informado', // Pega do relacionamento
                    $pagamento->parcela,
                    $pagamento->valor,
                    $pagamento->data_pagamento ? date('d/m/Y', strtotime($pagamento->data_pagamento)) : '',
                    $pagamento->forma_pagamento,
                    $pagamento->status,
                    $pagamento->observacoes,
                    $pagamento->created_at ? $pagamento->created_at->format('d/m/Y H:i') : ''
                ]);
            }

            // Fecha o ponteiro do arquivo
            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }
}
