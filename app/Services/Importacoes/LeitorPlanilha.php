<?php

namespace App\Services\Importacoes;

use Illuminate\Support\Str;
use XMLReader;
use ZipArchive;

/**
 * Lê a planilha enviada na tela Importar — Excel (.xlsx) ou CSV — e devolve
 * as linhas como [coluna_canônica => valor]. Usado por
 * ImportacaoSeguradosService.
 *
 * O cabeçalho é reconhecido por apelidos ("Nome", "CPF", "Nº Apólice",
 * "Vencimento"...), sem diferenciar maiúsculas, acentos ou espaços. Colunas
 * desconhecidas são ignoradas (e avisadas).
 *
 * O .xlsx é lido direto do ZIP com XMLReader, sem biblioteca externa. Datas
 * do Excel chegam como número de série (ex.: 46023) e são convertidas pelo
 * NormalizadorImportacao nas colunas de data.
 */
class LeitorPlanilha
{
    public const MAX_LINHAS = 5000;

    // Proteção contra .xlsx "bomba": a planilha descompactada não passa disso.
    private const MAX_BYTES_XML = 80 * 1024 * 1024;

    /**
     * Coluna canônica => apelidos aceitos no cabeçalho (já normalizados:
     * minúsculas, sem acento, separadores viram "_").
     */
    public const APELIDOS = [
        'nome_completo' => ['nome_completo', 'nome', 'cliente', 'segurado', 'nome_do_cliente', 'nome_do_segurado', 'nome_cliente', 'nome_segurado'],
        'cpf_cnpj' => ['cpf_cnpj', 'cpf', 'cnpj', 'cpf_ou_cnpj', 'documento', 'cpf_cnpj_do_cliente'],
        'email' => ['email', 'e_mail', 'email_do_cliente'],
        'celular_whatsapp' => ['celular_whatsapp', 'celular', 'whatsapp', 'telefone', 'telefone_celular', 'fone', 'celular_whats'],
        'telefone_fixo' => ['telefone_fixo', 'fixo', 'tel_fixo'],
        'data_nascimento' => ['data_nascimento', 'data_de_nascimento', 'nascimento', 'data_nascimento_fundacao', 'data_fundacao', 'data_de_fundacao', 'fundacao'],
        'razao_social' => ['razao_social'],
        'endereco' => ['endereco', 'logradouro', 'rua'],
        'bairro' => ['bairro'],
        'cidade' => ['cidade', 'municipio'],
        'estado' => ['estado', 'uf'],
        'cep' => ['cep'],
        'seguradora' => ['seguradora', 'companhia', 'cia', 'nome_da_seguradora'],
        'ramo' => ['ramo', 'produto', 'tipo_de_seguro', 'tipo_seguro'],
        'numero_apolice' => ['numero_apolice', 'apolice', 'n_apolice', 'no_apolice', 'num_apolice', 'numero_da_apolice', 'apolice_numero', 'n_da_apolice', 'no_da_apolice'],
        'inicio_vigencia' => ['inicio_vigencia', 'inicio_da_vigencia', 'vigencia_inicio', 'inicio', 'inicio_vig'],
        'fim_vigencia' => ['fim_vigencia', 'fim_da_vigencia', 'vigencia_fim', 'fim', 'termino_vigencia', 'termino_da_vigencia', 'final_vigencia', 'fim_vig'],
        'valor_premio_total' => ['valor_premio_total', 'premio_total', 'premio', 'valor_premio', 'valor_do_premio', 'valor_total'],
        'valor_cobertura' => ['valor_cobertura', 'cobertura', 'valor_da_cobertura', 'importancia_segurada'],
        'quantidade_parcelas' => ['quantidade_parcelas', 'qtd_parcelas', 'qtde_parcelas', 'total_parcelas', 'total_de_parcelas', 'parcelas', 'numero_de_parcelas', 'quantidade_de_parcelas'],
        'forma_pagamento' => ['forma_pagamento', 'forma_de_pagamento', 'meio_pagamento', 'meio_de_pagamento', 'pagamento'],
        'numero_parcela' => ['numero_parcela', 'parcela', 'n_parcela', 'no_parcela', 'num_parcela', 'numero_da_parcela', 'parcela_numero', 'n_da_parcela'],
        'valor_parcela' => ['valor_parcela', 'valor', 'valor_da_parcela', 'vlr_parcela'],
        'data_vencimento' => ['data_vencimento', 'vencimento', 'data_de_vencimento', 'vence_em', 'dt_vencimento', 'vencto'],
        'status_pagamento' => ['status_pagamento', 'status', 'situacao', 'situacao_do_pagamento', 'pago', 'status_do_pagamento'],
        'data_pagamento' => ['data_pagamento', 'data_de_pagamento', 'pago_em', 'dt_pagamento', 'data_do_pagamento'],
    ];

    /**
     * @return array{linhas: array<int, array<string, string>>, colunas: array<int, string>, avisos: array<int, string>, erro: string|null}
     *
     * `linhas` vem indexada pelo número da linha na planilha (o cabeçalho é a
     * linha 1), o mesmo número que o usuário vê no Excel.
     */
    public function ler(string $caminho): array
    {
        $inicio = (string) @file_get_contents($caminho, false, null, 0, 8);

        if ($inicio === '') {
            return $this->falha('A planilha está vazia.');
        }

        // .xls antigo (Excel 97-2003) é binário; não dá para ler sem biblioteca.
        if (str_starts_with($inicio, "\xD0\xCF\x11\xE0")) {
            return $this->falha('Arquivos .xls (Excel 97-2003) não são aceitos. No Excel, use "Salvar como" e escolha "Pasta de Trabalho do Excel (.xlsx)" ou "CSV".');
        }

        try {
            [$tabela, $erro] = str_starts_with($inicio, "PK\x03\x04")
                ? $this->lerXlsx($caminho)
                : $this->lerCsv($caminho);
        } catch (\Throwable $e) {
            report($e);

            return $this->falha('Não foi possível ler a planilha. Confira se o arquivo não está corrompido ou protegido por senha e tente de novo.');
        }

        if ($erro !== null) {
            return $this->falha($erro);
        }

        return $this->montarLinhas($tabela);
    }

    /**
     * Transforma a tabela crua (cabeçalho + linhas) no formato de saída,
     * reconhecendo o cabeçalho por apelido e descartando linhas em branco.
     *
     * @param  array<int, array<int, string>>  $tabela  número da linha => células
     */
    private function montarLinhas(array $tabela): array
    {
        $numeroCabecalho = array_key_first($tabela);

        if ($numeroCabecalho === null) {
            return $this->falha('A planilha está vazia.');
        }

        $avisos = [];
        $mapa = []; // índice da coluna na planilha => coluna canônica
        $ignoradas = [];

        foreach ($tabela[$numeroCabecalho] as $indice => $titulo) {
            $titulo = trim((string) $titulo);

            if ($titulo === '') {
                continue;
            }

            $canonica = self::colunaCanonica($titulo);

            if ($canonica === null) {
                $ignoradas[] = $titulo;
            } elseif (in_array($canonica, $mapa, true)) {
                $avisos[] = "A coluna \"{$titulo}\" repete uma coluna que já existe na planilha e foi ignorada.";
            } else {
                $mapa[$indice] = $canonica;
            }
        }

        if ($ignoradas !== []) {
            $avisos[] = 'Colunas não reconhecidas (ignoradas): '.implode(', ', $ignoradas).'.';
        }

        unset($tabela[$numeroCabecalho]);
        $linhas = [];

        foreach ($tabela as $numero => $celulas) {
            $linha = [];

            foreach ($mapa as $indice => $canonica) {
                $linha[$canonica] = trim((string) ($celulas[$indice] ?? ''));
            }

            if (implode('', $linha) === '') {
                continue; // linha em branco (comum no fim de planilhas do Excel)
            }

            if (count($linhas) >= self::MAX_LINHAS) {
                return $this->falha('A planilha tem mais de '.number_format(self::MAX_LINHAS, 0, ',', '.').' linhas. Divida em arquivos menores e importe um de cada vez.');
            }

            $linhas[$numero] = $linha;
        }

        return ['linhas' => $linhas, 'colunas' => array_values($mapa), 'avisos' => $avisos, 'erro' => null];
    }

    /**
     * "Nº da Apólice" → "numero_apolice". Devolve null se não reconhecer.
     */
    public static function colunaCanonica(string $titulo): ?string
    {
        $chave = Str::of($titulo)->ascii()->lower()->replaceMatches('/[^a-z0-9]+/', '_')->trim('_')->toString();
        // "Valor (R$)" → "valor_r": o "R$" não faz parte do nome da coluna.
        $chave = preg_replace('/_r$/', '', $chave);

        foreach (self::APELIDOS as $canonica => $apelidos) {
            if (in_array($chave, $apelidos, true)) {
                return $canonica;
            }
        }

        return null;
    }

    /**
     * CSV: aceita UTF-8 (com ou sem BOM) e o ANSI/Windows-1252 que o Excel em
     * português usa no "CSV (separado por vírgulas)". O separador (; , ou tab)
     * é detectado pelo cabeçalho. Células com quebra de linha entre aspas
     * contam como uma linha só, como no Excel.
     *
     * @return array{0: array<int, array<int, string>>, 1: string|null}
     */
    private function lerCsv(string $caminho): array
    {
        $conteudo = (string) file_get_contents($caminho);

        if (str_starts_with($conteudo, "\xEF\xBB\xBF")) {
            $conteudo = substr($conteudo, 3);
        }

        if (! mb_check_encoding($conteudo, 'UTF-8')) {
            $conteudo = mb_convert_encoding($conteudo, 'UTF-8', 'Windows-1252');
        }

        if (trim($conteudo) === '') {
            return [[], 'A planilha está vazia.'];
        }

        $primeiraLinha = strtok($conteudo, "\r\n");
        $contagem = [';' => substr_count($primeiraLinha, ';'), ',' => substr_count($primeiraLinha, ','), "\t" => substr_count($primeiraLinha, "\t")];
        arsort($contagem);
        $separador = array_key_first($contagem);

        $handle = fopen('php://temp', 'r+');
        fwrite($handle, $conteudo);
        rewind($handle);

        $tabela = [];
        $numero = 0;

        // escape '' : sem ele o PHP 8.4+ avisa que o padrão vai mudar, e a
        // barra invertida ("\") deixaria de ser tratada como texto comum.
        while (($celulas = fgetcsv($handle, null, $separador, '"', '')) !== false) {
            $numero++;

            if ($celulas === [null]) {
                continue; // linha totalmente vazia
            }

            $tabela[$numero] = array_map(fn ($c) => (string) $c, $celulas);

            if ($numero > self::MAX_LINHAS + 200) {
                break; // o limite real é conferido em montarLinhas()
            }
        }

        fclose($handle);

        return [$tabela, null];
    }

    /**
     * Excel .xlsx: lê a primeira aba. Textos ficam em sharedStrings.xml e as
     * células na planilha; números chegam como no Excel guarda (342.5,
     * 46023 para datas, 12345678000190 para um CNPJ digitado como número).
     *
     * @return array{0: array<int, array<int, string>>, 1: string|null}
     */
    private function lerXlsx(string $caminho): array
    {
        $zip = new ZipArchive;

        if ($zip->open($caminho, ZipArchive::RDONLY) !== true) {
            return [[], 'Não foi possível abrir a planilha do Excel. Confira se ela não está corrompida ou protegida por senha.'];
        }

        try {
            $abas = $this->caminhoPrimeiraAba($zip);

            if ($abas === null) {
                return [[], 'A planilha do Excel não tem nenhuma aba com dados.'];
            }

            $tamanho = $zip->statName($abas)['size'] ?? 0;
            $tamanhoTextos = $zip->statName('xl/sharedStrings.xml')['size'] ?? 0;

            if ($tamanho + $tamanhoTextos > self::MAX_BYTES_XML) {
                return [[], 'A planilha é grande demais para importar de uma vez. Divida em arquivos menores.'];
            }

            $textos = $this->lerTextosCompartilhados($zip);
            $tabela = $this->lerAba((string) $zip->getFromName($abas), $textos);
        } finally {
            $zip->close();
        }

        return [$tabela, null];
    }

    /**
     * Caminho (dentro do ZIP) da primeira aba visível no workbook.
     */
    private function caminhoPrimeiraAba(ZipArchive $zip): ?string
    {
        $workbook = $zip->getFromName('xl/workbook.xml');
        $relacoes = $zip->getFromName('xl/_rels/workbook.xml.rels');

        if ($workbook !== false && $relacoes !== false) {
            $wb = simplexml_load_string($workbook, options: LIBXML_NONET);
            $rels = simplexml_load_string($relacoes, options: LIBXML_NONET);

            if ($wb && $rels) {
                $alvos = [];
                foreach ($rels->Relationship as $rel) {
                    $alvos[(string) $rel['Id']] = (string) $rel['Target'];
                }

                foreach ($wb->sheets->sheet ?? [] as $aba) {
                    if ((string) $aba['state'] === 'hidden') {
                        continue;
                    }

                    $id = (string) $aba->attributes('http://schemas.openxmlformats.org/officeDocument/2006/relationships')['id'];
                    $alvo = $alvos[$id] ?? null;

                    if ($alvo !== null) {
                        $alvo = ltrim($alvo, '/');

                        return str_starts_with($alvo, 'xl/') ? $alvo : 'xl/'.$alvo;
                    }
                }
            }
        }

        return $zip->locateName('xl/worksheets/sheet1.xml') !== false ? 'xl/worksheets/sheet1.xml' : null;
    }

    /**
     * @return array<int, string>
     */
    private function lerTextosCompartilhados(ZipArchive $zip): array
    {
        $xml = $zip->getFromName('xl/sharedStrings.xml');

        if ($xml === false) {
            return [];
        }

        $leitor = new XMLReader;
        $leitor->XML($xml, null, LIBXML_NONET | LIBXML_COMPACT);
        $textos = [];
        $atual = null;

        while ($leitor->read()) {
            if ($leitor->nodeType === XMLReader::ELEMENT && $leitor->localName === 'si') {
                $atual = '';
            } elseif ($leitor->nodeType === XMLReader::ELEMENT && $leitor->localName === 't' && $atual !== null) {
                $atual .= $leitor->readString();
            } elseif ($leitor->nodeType === XMLReader::END_ELEMENT && $leitor->localName === 'si') {
                $textos[] = $atual;
                $atual = null;
            }
        }

        $leitor->close();

        return $textos;
    }

    /**
     * @param  array<int, string>  $textos
     * @return array<int, array<int, string>>
     */
    private function lerAba(string $xml, array $textos): array
    {
        $leitor = new XMLReader;
        $leitor->XML($xml, null, LIBXML_NONET | LIBXML_COMPACT);
        $tabela = [];
        $linhaAtual = 0;
        $colunaSeguinte = 0;

        while ($leitor->read()) {
            if ($leitor->nodeType !== XMLReader::ELEMENT) {
                continue;
            }

            if ($leitor->localName === 'row') {
                $linhaAtual = (int) ($leitor->getAttribute('r') ?: $linhaAtual + 1);
                $colunaSeguinte = 0;

                if (count($tabela) > self::MAX_LINHAS + 200) {
                    break; // o limite real é conferido em montarLinhas()
                }

                continue;
            }

            if ($leitor->localName !== 'c') {
                continue;
            }

            $referencia = (string) $leitor->getAttribute('r');
            $coluna = $referencia !== '' ? $this->indiceColuna($referencia) : $colunaSeguinte;
            $colunaSeguinte = $coluna + 1;
            $tipo = (string) $leitor->getAttribute('t');
            $valor = $this->valorCelula($leitor, $tipo, $textos);

            if ($valor !== '') {
                $tabela[$linhaAtual][$coluna] = $valor;
            }
        }

        $leitor->close();
        ksort($tabela);

        return $tabela;
    }

    /**
     * Valor de uma <c>: texto compartilhado (t="s"), texto direto
     * (inlineStr/str), booleano ou número.
     *
     * @param  array<int, string>  $textos
     */
    private function valorCelula(XMLReader $leitor, string $tipo, array $textos): string
    {
        if ($leitor->isEmptyElement) {
            return '';
        }

        $bruto = '';
        $profundidade = $leitor->depth;

        while ($leitor->read() && $leitor->depth > $profundidade) {
            if ($leitor->nodeType !== XMLReader::ELEMENT) {
                continue;
            }

            if ($leitor->localName === 'v') {
                $bruto = $leitor->readString();
            } elseif ($leitor->localName === 't') {
                $bruto .= $leitor->readString(); // inlineStr: <is><t>...</t></is>
            }
        }

        return match ($tipo) {
            's' => $textos[(int) $bruto] ?? '',
            'b' => $bruto === '1' ? 'VERDADEIRO' : 'FALSO',
            'e' => '', // célula com erro de fórmula (#N/D, #VALOR!...)
            'str', 'inlineStr' => $bruto,
            default => $this->numeroComoTexto($bruto),
        };
    }

    /**
     * Número do Excel como texto, sem notação científica: um CNPJ digitado
     * como número chega como "1.2345678000190E+13" e precisa virar
     * "12345678000190". Decimais (342.5) ficam como estão.
     */
    private function numeroComoTexto(string $bruto): string
    {
        if (! is_numeric($bruto)) {
            return $bruto;
        }

        if (stripos($bruto, 'e') !== false) {
            $numero = (float) $bruto;

            return floor($numero) === $numero ? sprintf('%.0f', $numero) : rtrim(rtrim(sprintf('%.10F', $numero), '0'), '.');
        }

        return $bruto;
    }

    /**
     * "C12" → 2 (A = 0).
     */
    private function indiceColuna(string $referencia): int
    {
        $letras = strtoupper(preg_replace('/\d/', '', $referencia));
        $indice = 0;

        foreach (str_split($letras) as $letra) {
            $indice = $indice * 26 + (ord($letra) - 64);
        }

        return $indice - 1;
    }

    private function falha(string $mensagem): array
    {
        return ['linhas' => [], 'colunas' => [], 'avisos' => [], 'erro' => $mensagem];
    }
}
