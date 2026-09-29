<?php

namespace App\Services\Importacoes;

use App\Models\Apolice;
use App\Models\HistoricoImportacao;
use App\Models\Parcelas;
use App\Models\Ramo;
use App\Models\Segurado;
use App\Models\Seguradora;
use App\Rules\CpfCnpjValido;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class ImportacaoSeguradosService
{
    /**
     * 'email', 'celular_whatsapp', 'inicio_vigencia', 'fim_vigencia' e
     * 'status_pagamento' são opcionais.
     */
    private const COLUNAS_OBRIGATORIAS = [
        'nome_completo',
        'cpf_cnpj',
        'seguradora',
        'ramo',
        'numero_apolice',
        'numero_parcela',
        'valor_parcela',
        'data_vencimento',
    ];

    /**
     * Cada linha faz várias idas ao banco (segurado, apólice, parcela), tudo
     * síncrono dentro da mesma requisição HTTP. Um arquivo maior que isso
     * arrisca estourar o tempo de execução do PHP/timeout do servidor antes
     * de terminar — melhor recusar de forma clara do que travar a requisição.
     */
    private const MAX_LINHAS = 5000;

    /**
     * @return array{total: int, importados: int, erros: array<string>, seguradorasFaltantes: array<string>}
     */
    public function importar(string $caminhoArquivo, ?string $nomeOriginal = null, ?int $usuarioId = null): array
    {
        try {
            [$linhas, $erroCabecalho] = $this->lerCsv($caminhoArquivo);
        } catch (\Throwable $e) {
            Log::error('Falha inesperada ao ler o arquivo de importação: '.$e->getMessage());

            return $this->resultadoVazio(['Não foi possível ler o arquivo enviado. Verifique se ele não está corrompido e tente novamente.']);
        }

        if ($erroCabecalho) {
            return $this->resultadoVazio([$erroCabecalho]);
        }

        if (count($linhas) === 0) {
            return $this->resultadoVazio(['O arquivo não contém nenhuma linha de dados para importar.']);
        }

        $resultado = [
            'total' => count($linhas),
            'importados' => 0,
            'erros' => [],
            'seguradorasFaltantes' => [],
        ];

        $seguradoras = Seguradora::all()->keyBy(fn ($s) => Str::lower(trim($s->nome_fantasia)));
        $ramosPorSeguradora = Ramo::all()
            ->groupBy('seguradora_id')
            ->map(fn ($grupo) => $grupo->keyBy(fn ($r) => Str::lower(trim($r->nome_ramo))));

        // Nome original (com a caixa digitada na planilha) de cada seguradora
        // que não foi encontrada, indexado em minúsculas só pra deduplicar —
        // usado depois pra sugerir o cadastro na tela.
        $seguradorasFaltantes = [];

        try {
            DB::transaction(function () use ($linhas, $seguradoras, $ramosPorSeguradora, &$resultado, &$seguradorasFaltantes) {
                foreach ($linhas as $numeroLinha => $linha) {
                    $processado = $this->processarLinha($linha, $seguradoras, $ramosPorSeguradora);

                    if ($processado['seguradoraFaltante'] !== null) {
                        $seguradorasFaltantes[Str::lower($processado['seguradoraFaltante'])] = $processado['seguradoraFaltante'];
                    }

                    if ($processado['erro'] !== null) {
                        $resultado['erros'][] = "Linha {$numeroLinha}: {$processado['erro']}";

                        continue;
                    }

                    $resultado['importados']++;
                }
            });
        } catch (\Throwable $e) {
            // Erro fora do que processarLinha() já isola linha a linha (ex:
            // conexão com o banco caiu no meio do processamento). Como é
            // dentro de uma única transação, nada foi persistido — devolve
            // uma mensagem amigável em vez de deixar a exceção subir pra um
            // 500 genérico.
            Log::error('Erro inesperado durante a importação de segurados: '.$e->getMessage());

            return $this->resultadoVazio(
                ['Ocorreu um erro inesperado durante a importação. Nenhuma linha foi salva — tente novamente ou contate o suporte.'],
                total: count($linhas),
            );
        }

        $resultado['seguradorasFaltantes'] = array_values($seguradorasFaltantes);

        if ($usuarioId) {
            HistoricoImportacao::create([
                'nome_arquivo' => $nomeOriginal ?? basename($caminhoArquivo),
                'tipo_importacao' => 'segurados',
                'usuario_id' => $usuarioId,
            ]);
        }

        return $resultado;
    }

    /**
     * @param  array<string>  $erros
     * @return array{total: int, importados: int, erros: array<string>, seguradorasFaltantes: array<string>}
     */
    private function resultadoVazio(array $erros, int $total = 0): array
    {
        return ['total' => $total, 'importados' => 0, 'erros' => $erros, 'seguradorasFaltantes' => []];
    }

    /**
     * @return array{0: array<int, array<string, string>>, 1: string|null}
     */
    private function lerCsv(string $caminho): array
    {
        $handle = @fopen($caminho, 'r');

        if ($handle === false) {
            return [[], 'Não foi possível abrir o arquivo enviado. Tente enviá-lo novamente.'];
        }

        // Arquivos exportados pelo Excel no Windows costumam vir com um BOM
        // UTF-8 na frente do cabeçalho. Sem remover, o nome da primeira
        // coluna chegava com bytes invisíveis colados na frente e nunca
        // batia com nenhuma das COLUNAS_OBRIGATORIAS — a importação recusava
        // um arquivo com o cabeçalho certinho, com um erro confuso.
        $temBom = fread($handle, 3) === "\xEF\xBB\xBF";
        if (! $temBom) {
            rewind($handle);
        }
        $inicioConteudo = ftell($handle);

        $primeiraLinha = fgets($handle);
        if ($primeiraLinha === false || trim($primeiraLinha) === '') {
            fclose($handle);

            return [[], 'O arquivo está vazio.'];
        }
        $separador = substr_count($primeiraLinha, ';') > substr_count($primeiraLinha, ',') ? ';' : ',';

        fseek($handle, $inicioConteudo);

        $cabecalho = fgetcsv($handle, 0, $separador);
        if ($cabecalho === false) {
            fclose($handle);

            return [[], 'Não foi possível ler o cabeçalho do arquivo.'];
        }

        $cabecalho = array_map(
            fn ($c) => Str::of($this->corrigirCodificacao((string) $c))->trim()->lower()->__toString(),
            $cabecalho,
        );
        $faltando = array_diff(self::COLUNAS_OBRIGATORIAS, $cabecalho);

        if (! empty($faltando)) {
            fclose($handle);

            return [[], 'Colunas obrigatórias ausentes: '.implode(', ', $faltando)];
        }

        $linhas = [];
        $numeroLinha = 1;

        while (($dados = fgetcsv($handle, 0, $separador)) !== false) {
            $numeroLinha++;

            if (count(array_filter($dados, fn ($v) => trim((string) $v) !== '')) === 0) {
                continue;
            }

            if (count($linhas) >= self::MAX_LINHAS) {
                fclose($handle);

                return [[], 'O arquivo tem mais de '.self::MAX_LINHAS.' linhas de dados. Divida em arquivos menores e importe em partes.'];
            }

            $dados = array_pad(array_slice($dados, 0, count($cabecalho)), count($cabecalho), null);
            $dados = array_map(fn ($v) => trim($this->corrigirCodificacao((string) $v)), $dados);
            $linhas[$numeroLinha] = array_combine($cabecalho, $dados);
        }

        fclose($handle);

        return [$linhas, null];
    }

    /**
     * Excel no Windows, em português, salva "CSV (separado por vírgulas)"
     * como Windows-1252/ANSI por padrão — só "CSV UTF-8" usa UTF-8 de
     * verdade. Sem essa correção, nomes com acento chegavam corrompidos ou
     * a linha inteira falhava ao gravar (a coluna no banco é UTF-8 estrito).
     */
    private function corrigirCodificacao(string $valor): string
    {
        if ($valor === '' || mb_check_encoding($valor, 'UTF-8')) {
            return $valor;
        }

        return mb_convert_encoding($valor, 'UTF-8', 'Windows-1252');
    }

    /**
     * @return array{erro: string|null, seguradoraFaltante: string|null}
     */
    private function processarLinha(array $linha, $seguradoras, $ramosPorSeguradora): array
    {
        $validator = Validator::make($linha, [
            'nome_completo' => ['required', 'string'],
            'cpf_cnpj' => ['required', 'string', new CpfCnpjValido],
            'email' => ['nullable', 'email'],
            'seguradora' => ['required', 'string'],
            'ramo' => ['required', 'string'],
            'numero_apolice' => ['required', 'string'],
            'numero_parcela' => ['required', 'integer', 'min:1'],
            'valor_parcela' => ['required'],
            'data_vencimento' => ['required', 'date'],
            'inicio_vigencia' => ['nullable', 'date'],
            'fim_vigencia' => ['nullable', 'date'],
        ]);

        if ($validator->fails()) {
            return ['erro' => $validator->errors()->first(), 'seguradoraFaltante' => null];
        }

        $nomeSeguradora = trim($linha['seguradora']);
        $seguradora = $seguradoras->get(Str::lower($nomeSeguradora));
        if (! $seguradora) {
            return [
                'erro' => "seguradora \"{$nomeSeguradora}\" não encontrada — cadastre-a antes de importar.",
                'seguradoraFaltante' => $nomeSeguradora,
            ];
        }

        $ramo = $ramosPorSeguradora->get($seguradora->id)?->get(Str::lower($linha['ramo']));
        if (! $ramo) {
            return [
                'erro' => "ramo \"{$linha['ramo']}\" não encontrado para a seguradora \"{$seguradora->nome_fantasia}\".",
                'seguradoraFaltante' => null,
            ];
        }

        if (
            ! empty($linha['inicio_vigencia']) && ! empty($linha['fim_vigencia'])
            && strtotime($linha['fim_vigencia']) <= strtotime($linha['inicio_vigencia'])
        ) {
            return [
                'erro' => 'a data de fim de vigência precisa ser posterior à data de início de vigência.',
                'seguradoraFaltante' => null,
            ];
        }

        $cpfCnpj = preg_replace('/\D/', '', $linha['cpf_cnpj']);
        // 'pf'/'pj' — mesmo vocabulário usado no cadastro manual
        // (StoreSeguradoRequest::tipo_pessoa) e checado no frontend
        // (isPF === 'pf'). Usar 'Física'/'Jurídica' aqui fazia o cliente
        // importado aparecer com o tipo errado na tela de perfil.
        $tipoPessoa = match (strlen($cpfCnpj)) {
            11 => 'pf',
            14 => 'pj',
            default => null,
        };
        if ($tipoPessoa === null) {
            return [
                'erro' => "CPF/CNPJ \"{$linha['cpf_cnpj']}\" parece inválido (precisa ter 11 ou 14 dígitos).",
                'seguradoraFaltante' => null,
            ];
        }

        // Mesma máscara aplicada no cadastro manual (formataCpfCnpj no
        // frontend) — sem isso, o mesmo documento ficava salvo com e sem
        // pontuação dependendo da origem do cadastro, furando a checagem
        // de duplicidade (CpfCnpjDisponivel compara a string exata).
        $cpfCnpjFormatado = $this->formatarCpfCnpj($cpfCnpj);

        $valorParcela = $this->parseValorMonetario($linha['valor_parcela']);
        if ($valorParcela === null) {
            return [
                'erro' => "valor da parcela \"{$linha['valor_parcela']}\" não é um valor monetário válido.",
                'seguradoraFaltante' => null,
            ];
        }
        if ($valorParcela < 0) {
            return [
                'erro' => "valor da parcela \"{$linha['valor_parcela']}\" não pode ser negativo.",
                'seguradoraFaltante' => null,
            ];
        }

        // 'em_aberto'/'paga'/'vencida' — mesmo vocabulário usado no resto do
        // sistema (Parcelas::status_pagamento). 'Pago'/'Pendente'/'Atrasado'
        // não eram reconhecidos em nenhuma outra query (cobrança, suspensão
        // automática, dashboard), então parcela importada ficava invisível
        // pra tudo isso.
        $statusPagamentoBruto = Str::lower(trim($linha['status_pagamento'] ?? ''));
        $statusPagamento = match ($statusPagamentoBruto) {
            'pago' => 'paga',
            'atrasado' => 'vencida',
            default => 'em_aberto',
        };

        try {
            DB::transaction(function () use ($linha, $cpfCnpjFormatado, $tipoPessoa, $seguradora, $ramo, $valorParcela, $statusPagamento) {
                // 1) Segurado — só sobrescreve campos opcionais se vierem
                // preenchidos, pra não apagar dados já existentes com linhas
                // incompletas.
                $segurado = Segurado::firstOrNew(['cpf_cnpj' => $cpfCnpjFormatado]);
                $segurado->nome_completo = $linha['nome_completo'];
                $segurado->tipo_pessoa = $tipoPessoa;
                if (! empty($linha['email'])) {
                    $segurado->email = $linha['email'];
                }
                if (! empty($linha['celular_whatsapp'])) {
                    $segurado->celular_whatsapp = $linha['celular_whatsapp'];
                }
                $segurado->save();

                // 2) Apólice
                $apolice = Apolice::firstOrNew(['numero_apolice' => $linha['numero_apolice']]);
                $apolice->cliente_id = $segurado->id;
                $apolice->seguradora_id = $seguradora->id;
                $apolice->ramo_id = $ramo->id;
                if (! empty($linha['inicio_vigencia'])) {
                    $apolice->inicio_vigencia = $linha['inicio_vigencia'];
                } elseif (! $apolice->exists) {
                    $apolice->inicio_vigencia = now()->toDateString();
                }
                if (! empty($linha['fim_vigencia'])) {
                    $apolice->fim_vigencia = $linha['fim_vigencia'];
                }
                // Não seta mais 'status' — a coluna foi removida de apolices
                // (migration drop_status_from_apolices_table); escrever nela
                // quebrava o INSERT com erro de coluna inexistente.
                $apolice->save();

                // 3) Parcela (chave: apólice + número da parcela)
                Parcelas::updateOrCreate(
                    [
                        'apolice_id' => $apolice->id,
                        'numero_parcela' => (int) $linha['numero_parcela'],
                    ],
                    [
                        'valor_parcela' => $valorParcela,
                        'data_vencimento' => $linha['data_vencimento'],
                        'status_pagamento' => $statusPagamento,
                    ]
                );
            });
        } catch (\Throwable $e) {
            // Isolado num savepoint (o DB::transaction acima está dentro da
            // transação maior de importar()): uma falha aqui desfaz só esta
            // linha, as demais continuam sendo processadas normalmente.
            Log::warning('Erro ao salvar linha da importação de segurados: '.$e->getMessage());

            return [
                'erro' => 'não foi possível salvar esta linha no banco de dados ('.$this->mensagemAmigavelExcecaoBanco($e).').',
                'seguradoraFaltante' => null,
            ];
        }

        return ['erro' => null, 'seguradoraFaltante' => null];
    }

    /**
     * Traduz exceções de banco (SQL bruto, nomes de constraint) pra algo que
     * faz sentido pra quem está importando uma planilha, sem vazar detalhes
     * internos do driver/SGBD.
     */
    private function mensagemAmigavelExcecaoBanco(\Throwable $e): string
    {
        $mensagem = $e->getMessage();

        if (str_contains($mensagem, 'parcelas_valor_nao_negativo')) {
            return 'o valor da parcela não pode ser negativo';
        }

        if (str_contains($mensagem, 'duplicate key value violates unique constraint') || str_contains($mensagem, 'Duplicate entry')) {
            return 'já existe um registro com esses mesmos dados';
        }

        if (str_contains($mensagem, 'violates foreign key constraint') || str_contains($mensagem, 'foreign key constraint fails')) {
            return 'referência inválida (seguradora, ramo ou cliente)';
        }

        return 'erro inesperado, tente novamente';
    }

    /**
     * Aplica a mesma máscara do cadastro manual (formataCpfCnpj no
     * frontend): CPF vira 000.000.000-00, CNPJ vira 00.000.000/0000-00.
     */
    private function formatarCpfCnpj(string $digitos): string
    {
        if (strlen($digitos) === 11) {
            return preg_replace('/(\d{3})(\d{3})(\d{3})(\d{2})/', '$1.$2.$3-$4', $digitos);
        }

        return preg_replace('/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/', '$1.$2.$3/$4-$5', $digitos);
    }

    /**
     * Aceita "1234.56" (padrão) ou "1.234,56" / "1234,56" (formato BR).
     * Retorna null quando o valor não contém nenhum dígito (ex: texto
     * qualquer) — antes disso era silenciosamente lido como 0.
     */
    private function parseValorMonetario(string $valor): ?float
    {
        $valor = preg_replace('/[^\d,.-]/', '', $valor);

        if ($valor === '' || ! preg_match('/\d/', $valor)) {
            return null;
        }

        // Decide pelo separador MAIS À DIREITA, não por quais existem.
        // A versão anterior tratava "tem vírgula e ponto" e "só vírgula", mas
        // "só ponto" caía no caso implícito e era lido como decimal
        // americano: "2.500" virava 2.5, ou seja, uma planilha em pt-BR com
        // valores redondos importava parcelas MIL VEZES menores, em silêncio.
        //
        // A regra: se o último separador está a exatamente 2 dígitos do fim,
        // ele é decimal; qualquer outro separador é de milhar. Caso contrário,
        // todos são de milhar. Isso cobre "1.234,56", "1,234.56", "2.500",
        // "2,500", "1.234.567" e "12,5" sem ambiguidade.
        $posVirgula = strrpos($valor, ',');
        $posPonto = strrpos($valor, '.');
        $ultimoSeparador = max($posVirgula === false ? -1 : $posVirgula, $posPonto === false ? -1 : $posPonto);

        if ($ultimoSeparador === -1) {
            return (float) $valor;
        }

        $casasDepois = strlen($valor) - $ultimoSeparador - 1;

        if ($casasDepois === 1 || $casasDepois === 2) {
            // É separador decimal: tira todos os outros e normaliza para ponto.
            $inteiro = preg_replace('/[^\d-]/', '', substr($valor, 0, $ultimoSeparador));
            $decimais = substr($valor, $ultimoSeparador + 1);

            return (float) ($inteiro.'.'.$decimais);
        }

        // Nenhum decimal: todo separador é de milhar.
        return (float) preg_replace('/[^\d-]/', '', $valor);
    }
}
