<?php

namespace App\Services\Importacoes;

use App\Models\Apolice;
use App\Models\HistoricoImportacao;
use App\Models\parcelas as Parcela;
use App\Models\Ramo;
use App\Models\Segurado;
use App\Models\Seguradora;
use Illuminate\Support\Facades\DB;
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

    private const LINHAS_POR_LOTE = 500;

    /**
     * @return array{total: int, importados: int, erros: array<string>}
     */
    public function importar(string $caminhoArquivo, ?string $nomeOriginal = null, ?int $usuarioId = null): array
    {
        [$linhas, $erroCabecalho] = $this->lerCsv($caminhoArquivo);

        if ($erroCabecalho) {
            return ['total' => 0, 'importados' => 0, 'erros' => [$erroCabecalho]];
        }

        $resultado = [
            'total' => count($linhas),
            'importados' => 0,
            'erros' => [],
        ];

        $seguradoras = Seguradora::all()->keyBy(fn ($s) => Str::lower(trim($s->nome_fantasia)));
        $ramosPorSeguradora = Ramo::all()
            ->groupBy('seguradora_id')
            ->map(fn ($grupo) => $grupo->keyBy(fn ($r) => Str::lower(trim($r->nome_ramo))));

        DB::transaction(function () use ($linhas, $seguradoras, $ramosPorSeguradora, &$resultado) {
            foreach (array_chunk($linhas, self::LINHAS_POR_LOTE, true) as $lote) {
                foreach ($lote as $numeroLinha => $linha) {
                    $erro = $this->processarLinha($linha, $seguradoras, $ramosPorSeguradora);

                    if ($erro) {
                        $resultado['erros'][] = "Linha {$numeroLinha}: {$erro}";
                        continue;
                    }

                    $resultado['importados']++;
                }
            }
        });

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
     * @return array{0: array<int, array<string, string>>, 1: string|null}
     */
    private function lerCsv(string $caminho): array
    {
        $handle = fopen($caminho, 'r');

        $primeiraLinha = fgets($handle);
        $primeiraLinha = preg_replace('/^\x{FEFF}/u', '', $primeiraLinha ?? '');
        $separador = substr_count($primeiraLinha, ';') > substr_count($primeiraLinha, ',') ? ';' : ',';
        rewind($handle);

        $cabecalho = fgetcsv($handle, 0, $separador);
        if ($cabecalho === false) {
            fclose($handle);
            return [[], 'Não foi possível ler o cabeçalho do arquivo.'];
        }

        $cabecalho = array_map(fn ($c) => Str::of($c)->trim()->lower()->__toString(), $cabecalho);
        $faltando = array_diff(self::COLUNAS_OBRIGATORIAS, $cabecalho);

        if (! empty($faltando)) {
            fclose($handle);
            return [[], 'Colunas obrigatórias ausentes: ' . implode(', ', $faltando)];
        }

        $linhas = [];
        $numeroLinha = 1;

        while (($dados = fgetcsv($handle, 0, $separador)) !== false) {
            $numeroLinha++;

            if (count(array_filter($dados, fn ($v) => trim((string) $v) !== '')) === 0) {
                continue;
            }

            $dados = array_pad(array_slice($dados, 0, count($cabecalho)), count($cabecalho), null);
            $linhas[$numeroLinha] = array_combine($cabecalho, array_map(fn ($v) => trim((string) $v), $dados));
        }

        fclose($handle);

        return [$linhas, null];
    }

    private function processarLinha(array $linha, $seguradoras, $ramosPorSeguradora): ?string
    {
        $validator = Validator::make($linha, [
            'nome_completo' => ['required', 'string'],
            'cpf_cnpj' => ['required', 'string'],
            'email' => ['nullable', 'email'],
            'seguradora' => ['required', 'string'],
            'ramo' => ['required', 'string'],
            'numero_apolice' => ['required', 'string'],
            'numero_parcela' => ['required', 'numeric'],
            'valor_parcela' => ['required'],
            'data_vencimento' => ['required', 'date'],
            'inicio_vigencia' => ['nullable', 'date'],
            'fim_vigencia' => ['nullable', 'date'],
        ]);

        if ($validator->fails()) {
            return $validator->errors()->first();
        }

        $seguradora = $seguradoras->get(Str::lower($linha['seguradora']));
        if (! $seguradora) {
            return "seguradora \"{$linha['seguradora']}\" não encontrada — cadastre-a antes de importar.";
        }

        $ramo = $ramosPorSeguradora->get($seguradora->id)?->get(Str::lower($linha['ramo']));
        if (! $ramo) {
            return "ramo \"{$linha['ramo']}\" não encontrado para a seguradora \"{$seguradora->nome_fantasia}\".";
        }

        $cpfCnpj = preg_replace('/\D/', '', $linha['cpf_cnpj']);
        $tipoPessoa = match (strlen($cpfCnpj)) {
            11 => 'Física',
            14 => 'Jurídica',
            default => null,
        };
        if ($tipoPessoa === null) {
            return "CPF/CNPJ \"{$linha['cpf_cnpj']}\" parece inválido (precisa ter 11 ou 14 dígitos).";
        }

        $statusPagamento = ucfirst(strtolower($linha['status_pagamento'] ?? ''));
        if (! in_array($statusPagamento, ['Pago', 'Pendente', 'Atrasado'], true)) {
            $statusPagamento = 'Pendente';
        }

        // 1) Segurado — só sobrescreve campos opcionais se vierem preenchidos,
        // pra não apagar dados já existentes com linhas incompletas.
        $segurado = Segurado::firstOrNew(['cpf_cnpj' => $cpfCnpj]);
        $segurado->nome_completo = $linha['nome_completo'];
        $segurado->tipo_pessoa = $tipoPessoa;
        if (! empty($linha['email'])) $segurado->email = $linha['email'];
        if (! empty($linha['celular_whatsapp'])) $segurado->celular_whatsapp = $linha['celular_whatsapp'];
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
        if (! $apolice->exists) {
            $apolice->status = 'Ativa';
        }
        $apolice->save();

        // 3) Parcela (chave: apólice + número da parcela)
        Parcela::updateOrCreate(
            [
                'apolice_id' => $apolice->id,
                'numero_parcela' => (int) $linha['numero_parcela'],
            ],
            [
                'valor_parcela' => $this->parseValorMonetario($linha['valor_parcela']),
                'data_vencimento' => $linha['data_vencimento'],
                'status_pagamento' => $statusPagamento,
            ]
        );

        return null;
    }

    /**
     * Aceita "1234.56" (padrão) ou "1.234,56" / "1234,56" (formato BR).
     */
    private function parseValorMonetario(string $valor): float
    {
        $valor = preg_replace('/[^\d,.-]/', '', $valor);

        if (str_contains($valor, ',') && str_contains($valor, '.')) {
            $valor = str_replace('.', '', $valor);
            $valor = str_replace(',', '.', $valor);
        } elseif (str_contains($valor, ',')) {
            $valor = str_replace(',', '.', $valor);
        }

        return (float) $valor;
    }
}
