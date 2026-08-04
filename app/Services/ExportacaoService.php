<?php

namespace App\Services;

use App\Models\Segurado;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ExportacaoService
{
    //StreamedResponse Cria um fluxo de dados para o navegador, permitindo que o arquivo seja baixado sem precisar armazená-lo no servidor
    public function exportarSeguradosCsv(): StreamedResponse
    {
        //Nome do arquivo = segurados + data atual + extensão .csv
        $fileName = 'Segurados-' . date('Y-m-d') . '.csv';

        //Busca segurados no banco de dados
        $segurados = Segurado::all();

        // Cabeçalhos HTTP para o navegador saber que é um arquivo CSV para download
        $headers = [
            "Content-type"        => "text/csv; charset=UTF-8",
            "Content-Disposition" => "attachment; filename=$fileName",
            "Pragma"              => "no-cache",
            "Cache-Control"       => "must-revalidate, post-check=0, pre-check=0",
            "Expires"             => "0"
        ];

        // Callback monta o arquivo CSV linha por linha e envia para o navegador
        $callback = function () use ($segurados) {
            //Abre um ponteiro de escrita direto para saida do PHP 
            $file = fopen('php://output', 'w');

            // Adiciona o BOM do UTF-8 para o Excel reconhecer acentos (ç, ã, é)
            fprintf($file, chr(0xEF) . chr(0xBB) . chr(0xBF));

            // Escreve a primeira linha com os nomes das colunas na planilha
            fputcsv($file, [
                'ID',
                'Nome Completo',
                'CPF/CNPJ',
                'Telefone Fixo',
                'Celular/WhatsApp',
                'Endereço',
                'Cidade',
                'Estado',
                'CEP',
                'Observações',
                'Data de Criação'
            ]);

            // Percorre todos os segurados e escreve cada um como uma linha no CSV
            foreach ($segurados as $segurado) {
                //fputcsv escreve um array como uma linha CSV, separando os valores por vírgula
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

            // Fecha o ponteiro do arquivo após terminar de escrever
            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }
}
