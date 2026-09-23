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

    /**
     * Traduz o estado da apólice para o relatório da contabilidade. Uma
     * apólice arquivada (soft-deleted) continua tendo pagamentos válidos —
     * o `motivo_cancelamento` é o que distingue uma renovação, em que o
     * dinheiro do ciclo anterior é legítimo, de um cancelamento.
     */
    private function situacaoDaApolice(?Apolice $apolice): string
    {
        if (! $apolice) {
            return 'Apólice não encontrada';
        }

        if (! $apolice->trashed()) {
            return 'Vigente';
        }

        return match ($apolice->motivo_cancelamento) {
            Apolice::MOTIVO_CANCELAMENTO_RENOVADA => 'Renovada',
            Apolice::MOTIVO_CANCELAMENTO_ATRASO_PRIMEIRA_PARCELA => 'Cancelada — atraso da 1ª parcela',
            Apolice::MOTIVO_CANCELAMENTO_SUSPENSAO_PROLONGADA => 'Cancelada — suspensão prolongada',
            Apolice::MOTIVO_CANCELAMENTO_MANUAL => 'Cancelada — manual',
            default => 'Cancelada',
        };
    }

    // StreamedResponse cria um fluxo de dados direto para o navegador baixar sem ocupar memória do servidor
    public function exportarPagamentosCsv(array $filtros = []): StreamedResponse
    {
        // Nome do arquivo = pagamentos + data atual + extensão .csv
        $fileName = 'Pagamentos-'.date('Y-m-d').'.csv';

        // A consulta é montada aqui mas só é EXECUTADA dentro do callback,
        // via lazy(). Com ->get() o streaming não servia de nada: os
        // registros já estavam todos na memória antes da resposta começar.
        //
        // withTrashed() na apólice: o renovar() arquiva a apólice antiga mas
        // preserva os pagamentos do ciclo anterior de propósito. Sem isso, a
        // relação vinha null e o `?? 'Não informado'` mascarava a perda —
        // receita confirmada saía no relatório da contabilidade sem cliente
        // e sem número de apólice.
        //
        // scopeFilter é o MESMO filtro da listagem: o CSV precisa conter
        // exatamente o que a tela mostrava quando o operador clicou.
        // withTrashed nos DOIS níveis: a apólice E o cliente. Só na apólice
        // não bastava — um segurado arquivado fazia a receita sair no
        // relatório contábil com Cliente = "Não informado", exatamente o
        // sintoma que o withTrashed da apólice existe para evitar.
        $consulta = Pagamento::with([
            'apolice' => fn ($q) => $q->withTrashed(),
            'apolice.cliente' => fn ($q) => $q->withTrashed(),
            'registradoPor',
        ])->filter($filtros);

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
                // Coluna nova: sem ela, um pagamento de apólice renovada ou
                // cancelada era indistinguível de um de apólice vigente no
                // arquivo que vai para a contabilidade.
                'Situação da Apólice',
                // A conferência contábil é exatamente o momento em que se
                // pergunta "quem lançou isso?" — a coluna existe para que a
                // resposta não dependa de consultar o banco.
                'Registrado por',
            ]);

            // Percorre cada pagamento para preencher as linhas do CSV
            // lazy() e não cursor(): os dois mantêm memória constante, mas o
            // cursor() hidrata um model por vez e resolve os relacionamentos
            // individualmente — com o ->with() acima isso virava N+1 (medido:
            // 59 consultas para 29 linhas). O lazy() percorre em blocos e
            // aplica o eager loading por bloco, então a memória continua
            // limitada e o número de consultas para de crescer com as linhas.
            foreach ($consulta->lazy() as $pagamento) {
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
                    $this->situacaoDaApolice($pagamento->apolice),
                    $pagamento->registradoPor->name ?? 'Sistema',
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
