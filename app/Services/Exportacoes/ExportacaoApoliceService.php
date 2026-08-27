<?php

namespace App\Services\Exportacoes;

use App\Models\Apolice;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ExportacaoApoliceService
{
    // StreamedResponse cria um fluxo de dados direto para o navegador baixar sem ocupar memória do servidor
    public function exportarApolicesCsv(): StreamedResponse
    {
        // Nome do arquivo = apolices + data atual + extensão .csv
        $fileName = 'Apolices-' . date('Y-m-d') . '.csv';

        // Busca as apólices carregando os relacionamentos para trazer os nomes em vez dos IDs
        $apolices = Apolice::with(['cliente', 'seguradora', 'ramo'])->get();

        // Cabeçalhos HTTP para o navegador identificar o arquivo CSV
        $headers = [
            "Content-type"        => "text/csv; charset=UTF-8",
            "Content-Disposition" => "attachment; filename=$fileName",
            "Pragma"              => "no-cache",
            "Cache-Control"       => "must-revalidate, post-check=0, pre-check=0",
            "Expires"             => "0"
        ];

        // Callback monta o arquivo CSV linha por linha
        $callback = function () use ($apolices) {
            // Abre um ponteiro de escrita direto para a saída do PHP
            $file = fopen('php://output', 'w');

            // Adiciona o BOM do UTF-8 para o Excel reconhecer acentos e caracteres especiais
            fprintf($file, chr(0xEF) . chr(0xBB) . chr(0xBF));

            // Cabeçalhos das colunas correspondentes à tabela do banco
            fputcsv($file, [
                'ID',
                'Número da Apólice',
                'Cliente',
                'Seguradora',
                'Ramo',
                'Prêmio Total',
                'Valor da Cobertura',
                'Quantidade de Parcelas',
                'Forma de Pagamento',
                'Início da Vigência',
                'Fim da Vigência',
                'Status',
                'Observações',
                'Data de Criação'
            ]);

            // Percorre cada apólice para preencher as linhas do CSV
            foreach ($apolices as $apolice) {
                fputcsv($file, [
                    $apolice->id,
                    $apolice->numero_apolice,
                    $apolice->cliente->nome_completo ?? 'Não informado', // Pega do relacionamento
                    $apolice->seguradora->nome_fantasia ?? 'Não informado', // Pega do relacionamento
                    $apolice->ramo->nome_ramo ?? 'Não informado', // Pega do relacionamento
                    $apolice->valor_premio_total,
                    $apolice->valor_cobertura,
                    $apolice->quantidade_parcelas,
                    $apolice->forma_pagamento,
                    $apolice->inicio_vigencia ? date('d/m/Y', strtotime($apolice->inicio_vigencia)) : '',
                    $apolice->fim_vigencia ? date('d/m/Y', strtotime($apolice->fim_vigencia)) : '',
                    $apolice->status,
                    $apolice->observacoes,
                    $apolice->created_at ? $apolice->created_at->format('d/m/Y H:i') : ''
                ]);
            }

            // Fecha o ponteiro do arquivo
            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }
}