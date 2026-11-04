<?php

namespace App\Services\Importacoes;

use App\Models\Apolice;
use App\Models\HistoricoImportacao;
use App\Models\Pagamento;
use App\Models\Parcelas;
use App\Models\Segurado;
use App\Models\Seguradora;
use App\Services\Auditoria\AuditoriaService;
use Carbon\CarbonImmutable;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

/**
 * Importação da tela Importar: cada linha da planilha é uma parcela, com o
 * cliente e a apólice dela. Chamado por ImportacaoController.
 *
 * Funciona em duas fases:
 *  1. analisar(): lê a planilha, valida cada linha, confere as linhas entre
 *     si e confronta com o banco em poucas consultas (em lote). Não grava
 *     nada — é o que a prévia (verificar()) mostra.
 *  2. executar(): grava o plano numa única transação, em lote. Ou entra tudo
 *     que foi validado, ou nada.
 *
 * A versão anterior gravava linha a linha (~6 consultas por linha). Com o
 * banco no Supabase (~67ms por consulta), uma planilha de ~150 linhas já
 * estourava os 30s do PHP e não importava nada.
 */
class ImportacaoSeguradosService
{
    public const COLUNAS_OBRIGATORIAS = [
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
     * Nome de cada coluna como aparece no modelo e nas mensagens. Todos são
     * reconhecidos pelo LeitorPlanilha.
     */
    public const NOMES_COLUNAS = [
        'nome_completo' => 'Nome',
        'cpf_cnpj' => 'CPF/CNPJ',
        'email' => 'E-mail',
        'celular_whatsapp' => 'Celular',
        'seguradora' => 'Seguradora',
        'ramo' => 'Ramo',
        'numero_apolice' => 'Número da Apólice',
        'numero_parcela' => 'Parcela',
        'valor_parcela' => 'Valor da Parcela',
        'data_vencimento' => 'Vencimento',
        'status_pagamento' => 'Status',
        'data_pagamento' => 'Data do Pagamento',
        'forma_pagamento' => 'Forma de Pagamento',
        'inicio_vigencia' => 'Início da Vigência',
        'fim_vigencia' => 'Fim da Vigência',
        'valor_premio_total' => 'Prêmio Total',
        'quantidade_parcelas' => 'Total de Parcelas',
        'valor_cobertura' => 'Cobertura',
        'data_nascimento' => 'Data de Nascimento',
        'telefone_fixo' => 'Telefone Fixo',
        'razao_social' => 'Razão Social',
        'endereco' => 'Endereço',
        'bairro' => 'Bairro',
        'cidade' => 'Cidade',
        'estado' => 'UF',
        'cep' => 'CEP',
    ];

    // A tela lista no máximo isso de erros/avisos; o total vem à parte.
    private const MAX_MENSAGENS = 300;

    private const COLUNAS_SEGURADO = [
        'nome_completo', 'tipo_pessoa', 'cpf_cnpj', 'email', 'celular_whatsapp', 'telefone_fixo',
        'data_nascimento_fundacao', 'razao_social', 'endereco', 'bairro', 'cidade', 'estado', 'cep',
    ];

    private const COLUNAS_APOLICE = [
        'numero_apolice', 'cliente_id', 'seguradora_id', 'ramo_id', 'valor_premio_total', 'valor_cobertura',
        'quantidade_parcelas', 'forma_pagamento', 'inicio_vigencia', 'fim_vigencia',
    ];

    private const COLUNAS_PARCELA = [
        'apolice_id', 'numero_parcela', 'valor_parcela', 'data_vencimento', 'data_pagamento',
        'status_pagamento', 'forma_pagamento_efetiva',
    ];

    public function __construct(
        private readonly LeitorPlanilha $leitor,
        private readonly NormalizadorImportacao $normalizar,
        private readonly AuditoriaService $auditoria,
    ) {}

    /**
     * Prévia: analisa sem gravar nada. É o que a tela mostra assim que o
     * arquivo é escolhido, antes do botão "Importar".
     */
    public function verificar(string $caminho, string $nomeArquivo): array
    {
        return $this->resumo($this->analisar($caminho), simulacao: true);
    }

    /**
     * Analisa e grava. Linhas com erro ficam de fora (e aparecem no resumo);
     * as demais entram juntas numa transação.
     */
    public function importar(string $caminho, string $nomeArquivo, ?int $usuarioId): array
    {
        $plano = $this->analisar($caminho);

        if ($plano->erroGeral === null && $plano->linhasValidas > 0) {
            try {
                DB::transaction(fn () => $this->executar($plano, $nomeArquivo, $usuarioId));
                $plano->gravado = true;
            } catch (\Throwable $e) {
                report($e);
                $plano->erroGeral = 'Não foi possível gravar a importação e nada foi salvo. Isso pode acontecer se outra pessoa alterou os mesmos clientes ou apólices agora há pouco — confira a prévia e tente de novo.';
            }
        }

        return $this->resumo($plano, simulacao: false);
    }

    /* ------------------------------------------------------------------ */
    /* Fase 1: análise (sem gravar)                                       */
    /* ------------------------------------------------------------------ */

    private function analisar(string $caminho): PlanoImportacao
    {
        $plano = new PlanoImportacao;
        $leitura = $this->leitor->ler($caminho);

        if ($leitura['erro'] !== null) {
            $plano->erroGeral = $leitura['erro'];

            return $plano;
        }

        foreach ($leitura['avisos'] as $aviso) {
            $plano->aviso(null, $aviso);
        }

        $faltando = array_diff(self::COLUNAS_OBRIGATORIAS, $leitura['colunas']);

        if ($faltando !== []) {
            $nomes = array_map(fn ($c) => self::NOMES_COLUNAS[$c], $faltando);
            $plano->erroGeral = 'Faltam colunas obrigatórias na primeira linha da planilha: '.implode(', ', $nomes).'. Baixe o modelo na tela para ver o formato.';

            return $plano;
        }

        $plano->total = count($leitura['linhas']);

        if ($plano->total === 0) {
            $plano->erroGeral = 'A planilha não tem nenhuma linha preenchida abaixo do cabeçalho.';

            return $plano;
        }

        $catalogo = $this->catalogoSeguradoras();
        $itens = [];

        foreach ($leitura['linhas'] as $numero => $linha) {
            $item = $this->interpretarLinha($numero, $linha, $catalogo, $plano);

            if ($item !== null) {
                $itens[$numero] = $item;
            }
        }

        $itens = $this->conferirEntreLinhas($itens, $plano);
        $this->confrontarComBanco($itens, $plano);

        return $plano;
    }

    /**
     * Seguradoras indexadas pelo nome fantasia e pela razão social, já com os
     * ramos, para achar sem diferenciar maiúsculas e acentos.
     *
     * @return array<string, Seguradora>
     */
    private function catalogoSeguradoras(): array
    {
        $catalogo = [];

        foreach (Seguradora::with('ramos')->get() as $seguradora) {
            foreach ([$seguradora->nome_fantasia, $seguradora->razao_social] as $nome) {
                if ($nome) {
                    $catalogo[$this->normalizar->chave($nome)] ??= $seguradora;
                }
            }
        }

        return $catalogo;
    }

    /**
     * Valida e converte uma linha. Devolve null se ela tiver erro (os erros
     * vão para o plano, com o número da linha).
     *
     * @param  array<string, string>  $linha
     * @param  array<string, Seguradora>  $catalogo
     */
    private function interpretarLinha(int $numero, array $linha, array $catalogo, PlanoImportacao $plano): ?array
    {
        $n = $this->normalizar;
        $valor = fn (string $coluna) => $linha[$coluna] ?? '';
        $erros = [];
        $avisos = [];

        // --- Cliente ---
        $nome = $n->texto($valor('nome_completo'));
        if ($nome === '') {
            $erros[] = 'Nome do cliente não preenchido.';
        } elseif (mb_strlen($nome) > 255) {
            $erros[] = 'Nome do cliente passa de 255 caracteres.';
        }

        $documento = $n->documento($valor('cpf_cnpj'));
        if ($documento['erro'] !== null) {
            $erros[] = ucfirst($documento['erro']);
        }

        // Campos opcionais do cliente: valor inválido vira aviso e o campo
        // fica de fora — não impede importar a parcela.
        $cliente = [];

        if ($valor('email') !== '') {
            $email = $n->email($valor('email'));

            if ($email !== null) {
                $cliente['email'] = $email;
            } else {
                $avisos[] = "E-mail \"{$valor('email')}\" inválido — o cliente foi importado sem e-mail.";
            }
        }

        foreach (['celular_whatsapp' => 'Celular', 'telefone_fixo' => 'Telefone fixo'] as $coluna => $rotulo) {
            if ($valor($coluna) !== '') {
                $telefone = $n->telefone($valor($coluna));

                if ($telefone !== null) {
                    $cliente[$coluna] = $telefone;
                } else {
                    $avisos[] = "{$rotulo} \"{$valor($coluna)}\" não reconhecido (use DDD + número) — não foi importado.";
                }
            }
        }

        if ($valor('data_nascimento') !== '') {
            $nascimento = $n->data($valor('data_nascimento'));

            if ($nascimento !== null && $nascimento <= now()->toDateString()) {
                $cliente['data_nascimento_fundacao'] = $nascimento;
            } else {
                $avisos[] = "Data de nascimento/fundação \"{$valor('data_nascimento')}\" inválida — não foi importada.";
            }
        }

        foreach (['razao_social' => 255, 'endereco' => 1000, 'bairro' => 100, 'cidade' => 100] as $coluna => $limite) {
            $texto = $n->texto($valor($coluna));
            if ($texto !== '') {
                $cliente[$coluna] = mb_substr($texto, 0, $limite);
            }
        }

        if ($valor('estado') !== '') {
            $uf = $n->uf($valor('estado'));

            if ($uf !== null) {
                $cliente['estado'] = $uf;
            } else {
                $avisos[] = "UF \"{$valor('estado')}\" não reconhecida — não foi importada.";
            }
        }

        if ($valor('cep') !== '') {
            $cep = $n->cep($valor('cep'));

            if ($cep !== null) {
                $cliente['cep'] = $cep;
            } else {
                $avisos[] = "CEP \"{$valor('cep')}\" inválido — não foi importado.";
            }
        }

        // --- Seguradora e ramo ---
        $seguradora = null;
        $ramo = null;
        $nomeSeguradora = $n->texto($valor('seguradora'));
        $nomeRamo = $n->texto($valor('ramo'));

        if ($nomeSeguradora === '') {
            $erros[] = 'Seguradora não preenchida.';
        } else {
            $seguradora = $catalogo[$n->chave($nomeSeguradora)] ?? null;

            if ($seguradora === null) {
                $erros[] = "Seguradora \"{$nomeSeguradora}\" não está cadastrada no sistema.";
                $plano->seguradorasFaltantes[$n->chave($nomeSeguradora)] = $nomeSeguradora;
            }
        }

        if ($nomeRamo === '') {
            $erros[] = 'Ramo não preenchido.';
        } elseif ($seguradora !== null) {
            $ramo = $seguradora->ramos->first(fn ($r) => $n->chave($r->nome_ramo) === $n->chave($nomeRamo));

            if ($ramo === null) {
                $disponiveis = $seguradora->ramos->pluck('nome_ramo')->implode(', ') ?: 'nenhum';
                $erros[] = "Ramo \"{$nomeRamo}\" não existe na {$seguradora->nome_fantasia} (ramos cadastrados: {$disponiveis}).";
                $plano->ramosFaltantes[$seguradora->id.'|'.$n->chave($nomeRamo)] = ['seguradora' => $seguradora->nome_fantasia, 'ramo' => $nomeRamo];
            }
        }

        // --- Apólice ---
        $numeroApolice = $n->texto($valor('numero_apolice'));
        if ($numeroApolice === '') {
            $erros[] = 'Número da apólice não preenchido.';
        } elseif (preg_match('/^\d[.,]?\d*E\+?\d+$/i', $numeroApolice)) {
            $erros[] = "O número da apólice \"{$numeroApolice}\" foi convertido pelo Excel em notação científica e perdeu dígitos. Formate a coluna como Texto e digite de novo.";
        } elseif (mb_strlen($numeroApolice) > 100) {
            $erros[] = 'Número da apólice passa de 100 caracteres.';
        }

        $apolice = [];

        foreach (['inicio_vigencia' => 'Início da vigência', 'fim_vigencia' => 'Fim da vigência'] as $coluna => $rotulo) {
            if ($valor($coluna) !== '') {
                $data = $n->data($valor($coluna));

                if ($data !== null) {
                    $apolice[$coluna] = $data;
                } else {
                    $erros[] = "{$rotulo} \"{$valor($coluna)}\" não é uma data válida (use DD/MM/AAAA).";
                }
            }
        }

        if (isset($apolice['inicio_vigencia'], $apolice['fim_vigencia']) && $apolice['fim_vigencia'] <= $apolice['inicio_vigencia']) {
            $erros[] = 'O fim da vigência precisa ser depois do início.';
        }

        foreach (['valor_premio_total' => 'Prêmio total', 'valor_cobertura' => 'Cobertura'] as $coluna => $rotulo) {
            if ($valor($coluna) !== '') {
                $dinheiro = $n->dinheiro($valor($coluna));

                if ($dinheiro !== null && $dinheiro >= 0) {
                    $apolice[$coluna] = $dinheiro;
                } else {
                    $avisos[] = "{$rotulo} \"{$valor($coluna)}\" inválido — não foi importado.";
                }
            }
        }

        if ($valor('quantidade_parcelas') !== '') {
            $quantidade = $n->inteiro($valor('quantidade_parcelas'));

            if ($quantidade !== null) {
                $apolice['quantidade_parcelas'] = $quantidade;
            } else {
                $avisos[] = "Total de parcelas \"{$valor('quantidade_parcelas')}\" inválido — calculado pelas parcelas da planilha.";
            }
        }

        if ($valor('forma_pagamento') !== '') {
            $forma = $n->formaPagamento($valor('forma_pagamento'));

            if ($forma !== null) {
                $apolice['forma_pagamento'] = $forma;
            } else {
                $avisos[] = "Forma de pagamento \"{$valor('forma_pagamento')}\" não reconhecida (use Boleto, Pix, Cartão ou Débito) — não foi importada.";
            }
        }

        // --- Parcela ---
        $parcela = null;
        if ($valor('numero_parcela') === '') {
            $erros[] = 'Número da parcela não preenchido.';
        } else {
            $parcela = $n->parcela($valor('numero_parcela'));
            if ($parcela === null) {
                $erros[] = "Parcela \"{$valor('numero_parcela')}\" inválida — use o número da parcela (1, 2, 3...) ou no formato 3/12.";
            }
        }

        $valorParcela = null;
        if ($valor('valor_parcela') === '') {
            $erros[] = 'Valor da parcela não preenchido.';
        } else {
            $valorParcela = $n->dinheiro($valor('valor_parcela'));
            if ($valorParcela === null) {
                $erros[] = "Valor da parcela \"{$valor('valor_parcela')}\" inválido (use, por exemplo, 342,50).";
            } elseif ($valorParcela < 0) {
                $erros[] = 'O valor da parcela não pode ser negativo.';
            } elseif ($valorParcela > 9_999_999_999_999) {
                $erros[] = 'Valor da parcela grande demais.';
            }
        }

        $vencimento = null;
        if ($valor('data_vencimento') === '') {
            $erros[] = 'Vencimento não preenchido.';
        } else {
            $vencimento = $n->data($valor('data_vencimento'));
            if ($vencimento === null) {
                $erros[] = "Vencimento \"{$valor('data_vencimento')}\" não é uma data válida (use DD/MM/AAAA).";
            }
        }

        $pago = $n->pago($valor('status_pagamento'));
        if ($pago === null) {
            $erros[] = "Status \"{$valor('status_pagamento')}\" não reconhecido — use \"Pago\" ou \"Em aberto\" (ou deixe vazio).";
        }

        $dataPagamento = null;
        if ($valor('data_pagamento') !== '') {
            $dataPagamento = $n->data($valor('data_pagamento'));
            if ($dataPagamento === null) {
                $erros[] = "Data do pagamento \"{$valor('data_pagamento')}\" não é uma data válida (use DD/MM/AAAA).";
            } elseif ($dataPagamento > now()->toDateString()) {
                $erros[] = 'A data do pagamento está no futuro.';
                $dataPagamento = null;
            } elseif ($pago === false && $valor('status_pagamento') !== '') {
                $avisos[] = "Status \"{$valor('status_pagamento')}\", mas com data de pagamento — a parcela foi considerada paga.";
            }
        }

        foreach ($avisos as $aviso) {
            $plano->aviso($numero, $aviso);
        }

        if ($erros !== []) {
            foreach ($erros as $erro) {
                $plano->erro($numero, $erro);
            }

            return null;
        }

        $paga = $dataPagamento !== null || $pago === true;

        if ($paga && $dataPagamento === null) {
            // "Pago" sem data: considera pago no vencimento (ou hoje, se o
            // vencimento ainda não chegou).
            $dataPagamento = min($vencimento, now()->toDateString());
        }

        return [
            'linha' => $numero,
            'cliente' => [
                'digitos' => $documento['digitos'],
                'nome_completo' => $nome,
                'tipo_pessoa' => strlen($documento['digitos']) === 11 ? 'pf' : 'pj',
            ] + $cliente,
            'apolice' => [
                'numero' => $numeroApolice,
                'seguradora' => $seguradora,
                'ramo' => $ramo,
            ] + $apolice,
            'parcela' => [
                'numero' => $parcela[0],
                'total' => $parcela[1],
                'valor' => $valorParcela,
                'vencimento' => $vencimento,
                'paga' => $paga,
                'data_pagamento' => $paga ? $dataPagamento : null,
            ],
        ];
    }

    /**
     * Confere as linhas entre si: parcela repetida, mesmo CPF com nomes
     * diferentes e e-mail repetido em clientes diferentes. (Mesma apólice com
     * outro CPF é conferida em confrontarComBanco(), porque se a apólice já
     * existe, quem manda é o dono cadastrado, não a primeira linha.)
     */
    private function conferirEntreLinhas(array $itens, PlanoImportacao $plano): array
    {
        $parcelas = [];
        $clientes = [];
        $emails = [];

        foreach ($itens as $linha => $item) {
            $numeroApolice = $item['apolice']['numero'];
            $digitos = $item['cliente']['digitos'];
            $chaveParcela = $numeroApolice.'|'.$item['parcela']['numero'];

            if (isset($parcelas[$chaveParcela])) {
                $plano->erro($linha, "A parcela {$item['parcela']['numero']} da apólice {$numeroApolice} já aparece na linha {$parcelas[$chaveParcela]}.");
                unset($itens[$linha]);

                continue;
            }

            $parcelas[$chaveParcela] = $linha;

            if (! isset($clientes[$digitos])) {
                $clientes[$digitos] = ['linha' => $linha, 'nome' => $item['cliente']['nome_completo']];
            } elseif ($this->normalizar->chave($clientes[$digitos]['nome']) !== $this->normalizar->chave($item['cliente']['nome_completo'])) {
                $plano->aviso($linha, "Este CPF/CNPJ aparece com outro nome na linha {$clientes[$digitos]['linha']} — foi mantido \"{$clientes[$digitos]['nome']}\".");
            }

            $email = $item['cliente']['email'] ?? null;

            if ($email !== null) {
                if (isset($emails[$email]) && $emails[$email] !== $digitos) {
                    $plano->aviso($linha, "O e-mail {$email} já é de outro cliente nesta planilha — este cliente ficou sem e-mail.");
                    unset($itens[$linha]['cliente']['email']);
                } else {
                    $emails[$email] = $digitos;
                }
            }
        }

        return $itens;
    }

    /**
     * Confronta com o que já existe no banco (em poucas consultas, em lote) e
     * monta as operações do plano: o que criar, o que atualizar, o que manter.
     */
    private function confrontarComBanco(array $itens, PlanoImportacao $plano): void
    {
        if ($itens === []) {
            return;
        }

        $hoje = now()->toDateString();

        // --- Clientes já cadastrados (vivos ou na lixeira) ---
        $digitos = array_values(array_unique(array_map(fn ($i) => $i['cliente']['digitos'], $itens)));
        $clientesBanco = $this->clientesPorDocumento($digitos);

        foreach ($itens as $linha => $item) {
            $registro = $clientesBanco[$item['cliente']['digitos']] ?? null;

            if ($registro !== null && $registro->trashed()) {
                $documento = $this->normalizar->formatarDocumento($item['cliente']['digitos']);
                $plano->erro($linha, "O cliente {$documento} está inativo (foi excluído). Restaure-o em Administração › Clientes Inativos e importe de novo.");
                unset($itens[$linha]);
            }
        }

        // --- E-mails que já são de outro cliente no banco ---
        $emails = [];
        foreach ($itens as $item) {
            if (isset($item['cliente']['email'])) {
                $emails[$item['cliente']['email']] = $item['cliente']['digitos'];
            }
        }

        $donosDeEmail = $this->donosDeEmail(array_keys($emails));

        foreach ($itens as $linha => $item) {
            $email = $item['cliente']['email'] ?? null;

            if ($email !== null && isset($donosDeEmail[$email]) && $donosDeEmail[$email] !== $item['cliente']['digitos']) {
                $plano->aviso($linha, "O e-mail {$email} já pertence a outro cliente cadastrado — este cliente foi importado sem esse e-mail.");
                unset($itens[$linha]['cliente']['email']);
            }
        }

        // --- Apólices já cadastradas (vivas ou canceladas) ---
        $numeros = array_values(array_unique(array_map(fn ($i) => $i['apolice']['numero'], $itens)));
        $apolicesBanco = $this->apolicesPorNumero($numeros);
        $nomesDonos = $this->nomesDosClientes(
            collect($apolicesBanco)->filter(fn ($a) => ! $a->trashed())->pluck('cliente_id')->unique()->all()
        );

        // Cada apólice tem um dono: o cadastrado (se ela já existe) ou o da
        // primeira linha em que aparece na planilha.
        $referencias = [];

        foreach ($itens as $linha => $item) {
            $numeroApolice = $item['apolice']['numero'];
            $apolice = $apolicesBanco[$numeroApolice] ?? null;

            if ($apolice !== null && $apolice->trashed()) {
                $plano->erro($linha, "A apólice {$numeroApolice} está cancelada/arquivada no sistema. Restaure-a em Administração antes de importar parcelas nela.");
                unset($itens[$linha]);

                continue;
            }

            if ($apolice !== null) {
                $cliente = $clientesBanco[$item['cliente']['digitos']] ?? null;

                if ($cliente === null || $cliente->id !== $apolice->cliente_id) {
                    $dono = $nomesDonos[$apolice->cliente_id] ?? 'outro cliente';
                    $plano->erro($linha, "A apólice {$numeroApolice} já está cadastrada para {$dono}. Confira o número da apólice e o CPF/CNPJ.");
                    unset($itens[$linha]);

                    continue;
                }
            }

            $referencia = $referencias[$numeroApolice] ?? null;

            if ($referencia === null) {
                $referencias[$numeroApolice] = [
                    'linha' => $linha,
                    'digitos' => $item['cliente']['digitos'],
                    'seguradora' => $item['apolice']['seguradora']->id,
                    'ramo' => $item['apolice']['ramo']->id,
                ];
            } elseif ($referencia['digitos'] !== $item['cliente']['digitos']) {
                $plano->erro($linha, "A apólice {$numeroApolice} já aparece na linha {$referencia['linha']} com outro CPF/CNPJ.");
                unset($itens[$linha]);
            } elseif ($referencia['seguradora'] !== $item['apolice']['seguradora']->id || $referencia['ramo'] !== $item['apolice']['ramo']->id) {
                $plano->erro($linha, "A apólice {$numeroApolice} aparece na linha {$referencia['linha']} com outra seguradora ou outro ramo.");
                unset($itens[$linha]);
            }
        }

        if ($itens === []) {
            return;
        }

        // --- Parcelas e pagamentos que já existem nas apólices cadastradas ---
        $idsApolices = collect($apolicesBanco)->filter(fn ($a) => ! $a->trashed())->pluck('id')->all();
        $parcelasBanco = [];
        $pagamentosBanco = [];

        foreach (array_chunk($idsApolices, 500) as $lote) {
            foreach (Parcelas::whereIn('apolice_id', $lote)->get() as $p) {
                $parcelasBanco[$p->apolice_id][$p->numero_parcela] = $p;
            }

            foreach (Pagamento::whereIn('apolice_id', $lote)->get(['apolice_id', 'parcela']) as $p) {
                $pagamentosBanco[$p->apolice_id.'|'.$p->parcela] = true;
            }
        }

        $this->planejarClientes($itens, $clientesBanco, $plano);
        $this->planejarApolices($itens, $apolicesBanco, $parcelasBanco, $plano);
        $this->planejarParcelas($itens, $apolicesBanco, $parcelasBanco, $pagamentosBanco, $hoje, $plano);
    }

    /**
     * @param  array<int, string>  $digitos
     * @return array<string, Segurado> dígitos => registro (o vivo, se houver)
     */
    private function clientesPorDocumento(array $digitos): array
    {
        $formatos = [];
        foreach ($digitos as $d) {
            $formatos[] = $d;
            $formatos[] = $this->normalizar->formatarDocumento($d);
        }

        $porDigitos = [];

        foreach (array_chunk($formatos, 500) as $lote) {
            foreach (Segurado::withTrashed()->whereIn('cpf_cnpj', $lote)->get() as $registro) {
                $chave = preg_replace('/\D/', '', $registro->cpf_cnpj);
                $atual = $porDigitos[$chave] ?? null;

                // Prefere o cadastro vivo ao que está na lixeira.
                if ($atual === null || ($atual->trashed() && ! $registro->trashed())) {
                    $porDigitos[$chave] = $registro;
                }
            }
        }

        return $porDigitos;
    }

    /**
     * @param  array<int, string>  $emails  já em minúsculas
     * @return array<string, string> e-mail => dígitos do CPF/CNPJ do dono
     */
    private function donosDeEmail(array $emails): array
    {
        $donos = [];

        foreach (array_chunk($emails, 500) as $lote) {
            $registros = Segurado::withTrashed()
                ->whereIn(DB::raw('lower(email)'), $lote)
                ->get(['email', 'cpf_cnpj', 'deleted_at']);

            foreach ($registros as $r) {
                $donos[mb_strtolower($r->email)] ??= preg_replace('/\D/', '', $r->cpf_cnpj);
            }
        }

        return $donos;
    }

    /**
     * @param  array<int, string>  $numeros
     * @return array<string, Apolice> número => registro (a viva, se houver)
     */
    private function apolicesPorNumero(array $numeros): array
    {
        $porNumero = [];

        foreach (array_chunk($numeros, 500) as $lote) {
            foreach (Apolice::withTrashed()->whereIn('numero_apolice', $lote)->get() as $apolice) {
                $atual = $porNumero[$apolice->numero_apolice] ?? null;

                if ($atual === null || ($atual->trashed() && ! $apolice->trashed())) {
                    $porNumero[$apolice->numero_apolice] = $apolice;
                }
            }
        }

        return $porNumero;
    }

    /**
     * @return array<int, string> id => nome
     */
    private function nomesDosClientes(array $ids): array
    {
        return $ids === [] ? [] : Segurado::withTrashed()->whereIn('id', $ids)->pluck('nome_completo', 'id')->all();
    }

    /**
     * Um cliente por CPF/CNPJ: novo, atualizado (só o que mudou) ou mantido.
     * Campos opcionais vazios na planilha não apagam o que já está cadastrado.
     */
    private function planejarClientes(array $itens, array $clientesBanco, PlanoImportacao $plano): void
    {
        $porDocumento = [];
        $primeiraLinha = [];

        foreach ($itens as $linha => $item) {
            $c = $item['cliente'];
            $primeiraLinha[$c['digitos']] ??= $linha;
            $atual = $porDocumento[$c['digitos']] ?? [];

            // O primeiro valor preenchido de cada coluna vale.
            foreach ($c as $coluna => $valor) {
                $atual[$coluna] ??= $valor;
            }

            $porDocumento[$c['digitos']] = $atual;
        }

        foreach ($porDocumento as $digitos => $dados) {
            $campos = array_intersect_key($dados, array_flip(self::COLUNAS_SEGURADO));
            $campos['cpf_cnpj'] = $this->normalizar->formatarDocumento($digitos);
            $existente = $clientesBanco[$digitos] ?? null;

            if ($existente === null) {
                $plano->clientesNovos[$digitos] = $campos;

                continue;
            }

            $plano->clientesExistentes[$digitos] = $existente->id;
            [$mudou, $antes] = $this->diferencas($existente, $campos);

            // Nome diferente num CPF já cadastrado pode ser erro de digitação
            // na planilha: atualiza, mas deixa visível.
            if (isset($mudou['nome_completo'])) {
                $plano->aviso($primeiraLinha[$digitos], "O CPF/CNPJ {$campos['cpf_cnpj']} já estava cadastrado como \"{$antes['nome_completo']}\" — o nome será atualizado para \"{$mudou['nome_completo']}\".");
            }

            if ($mudou !== []) {
                $plano->clientesAtualizados[$existente->id] = ['campos' => $mudou, 'antes' => $antes, 'nome' => $dados['nome_completo']];
            }
        }
    }

    /**
     * Uma apólice por número. Na criação, o que a planilha não trouxer é
     * deduzido das parcelas: início = 1 mês antes da 1ª parcela, fim = 1 ano
     * depois do início, total de parcelas e prêmio pela soma das parcelas.
     * Sem fim de vigência a apólice ficava "N/A" e o cliente "Inativo".
     */
    private function planejarApolices(array $itens, array $apolicesBanco, array $parcelasBanco, PlanoImportacao $plano): void
    {
        $grupos = [];

        foreach ($itens as $linha => $item) {
            $grupos[$item['apolice']['numero']][$linha] = $item;
        }

        foreach ($grupos as $numeroApolice => $grupo) {
            $primeiro = reset($grupo);
            $opcionais = $this->camposOpcionaisDaApolice($numeroApolice, $grupo, $plano);
            $parcelasPlanilha = array_map(fn ($i) => $i['parcela'], $grupo);
            $existente = $apolicesBanco[$numeroApolice] ?? null;

            if ($existente === null) {
                $inicio = $opcionais['inicio_vigencia']
                    ?? (isset($opcionais['fim_vigencia'])
                        ? CarbonImmutable::parse($opcionais['fim_vigencia'])->subYear()->toDateString()
                        : CarbonImmutable::parse(min(array_column($parcelasPlanilha, 'vencimento')))->subMonthNoOverflow()->toDateString());
                $fim = $opcionais['fim_vigencia'] ?? CarbonImmutable::parse($inicio)->addYear()->toDateString();
                $valores = array_column($parcelasPlanilha, 'valor', 'numero');
                $quantidade = $opcionais['quantidade_parcelas'] ?? $this->quantidadeParcelas($valores, $parcelasPlanilha);

                $plano->apolicesNovas[$numeroApolice] = [
                    'numero_apolice' => $numeroApolice,
                    'cliente_digitos' => $primeiro['cliente']['digitos'],
                    'seguradora_id' => $primeiro['apolice']['seguradora']->id,
                    'ramo_id' => $primeiro['apolice']['ramo']->id,
                    'inicio_vigencia' => $inicio,
                    'fim_vigencia' => $fim,
                    'quantidade_parcelas' => $quantidade,
                    'valor_premio_total' => $opcionais['valor_premio_total'] ?? $this->estimarPremio($valores, $quantidade),
                    'valor_cobertura' => $opcionais['valor_cobertura'] ?? null,
                    'forma_pagamento' => $opcionais['forma_pagamento'] ?? null,
                ];

                continue;
            }

            $plano->apolicesExistentes[$numeroApolice] = $existente->id;
            $campos = [
                'seguradora_id' => $primeiro['apolice']['seguradora']->id,
                'ramo_id' => $primeiro['apolice']['ramo']->id,
            ] + array_intersect_key($opcionais, array_flip(['inicio_vigencia', 'fim_vigencia', 'valor_cobertura', 'forma_pagamento', 'valor_premio_total', 'quantidade_parcelas']));

            $inicio = $campos['inicio_vigencia'] ?? $existente->getRawOriginal('inicio_vigencia');
            $fim = $campos['fim_vigencia'] ?? $existente->getRawOriginal('fim_vigencia');

            if ($inicio && $fim && $fim <= $inicio) {
                $plano->aviso(array_key_first($grupo), "As datas de vigência da planilha deixariam a apólice {$numeroApolice} com o fim antes do início — a vigência cadastrada foi mantida.");
                unset($campos['inicio_vigencia'], $campos['fim_vigencia']);
            }

            // Total de parcelas e prêmio: completa o que estiver faltando
            // com o conjunto (parcelas já cadastradas + as da planilha).
            $valores = collect($parcelasBanco[$existente->id] ?? [])->mapWithKeys(fn ($p, $num) => [$num => (float) $p->valor_parcela])->all();
            foreach ($parcelasPlanilha as $p) {
                $valores[$p['numero']] = $p['valor'];
            }

            if (! isset($campos['quantidade_parcelas'])) {
                $necessario = $this->quantidadeParcelas($valores, $parcelasPlanilha);
                if ($existente->quantidade_parcelas === null || $existente->quantidade_parcelas < $necessario) {
                    $campos['quantidade_parcelas'] = $necessario;
                }
            }

            if (! isset($campos['valor_premio_total']) && $existente->valor_premio_total === null) {
                $campos['valor_premio_total'] = $this->estimarPremio($valores, $campos['quantidade_parcelas'] ?? $existente->quantidade_parcelas);
            }

            [$mudou, $antes] = $this->diferencas($existente, $campos);

            if (isset($mudou['seguradora_id']) || isset($mudou['ramo_id'])) {
                $plano->aviso(array_key_first($grupo), "A seguradora/ramo da apólice {$numeroApolice} foi atualizado para {$primeiro['apolice']['seguradora']->nome_fantasia} / {$primeiro['apolice']['ramo']->nome_ramo}.");
            }

            if ($mudou !== []) {
                $plano->apolicesAtualizadas[$existente->id] = [
                    'campos' => $mudou,
                    'antes' => $antes,
                    'numero' => $numeroApolice,
                    'cliente' => $primeiro['cliente']['nome_completo'],
                ];
            }
        }
    }

    /**
     * Campos da apólice que podem vir em qualquer linha dela: vale o primeiro
     * preenchido; valores diferentes em outras linhas geram aviso.
     */
    private function camposOpcionaisDaApolice(string $numeroApolice, array $grupo, PlanoImportacao $plano): array
    {
        $escolhidos = [];
        $origem = [];
        $rotulos = [
            'inicio_vigencia' => 'início da vigência', 'fim_vigencia' => 'fim da vigência',
            'valor_premio_total' => 'prêmio total', 'valor_cobertura' => 'cobertura',
            'quantidade_parcelas' => 'total de parcelas', 'forma_pagamento' => 'forma de pagamento',
        ];

        foreach ($grupo as $linha => $item) {
            foreach ($rotulos as $coluna => $rotulo) {
                if (! array_key_exists($coluna, $item['apolice'])) {
                    continue;
                }

                if (! array_key_exists($coluna, $escolhidos)) {
                    $escolhidos[$coluna] = $item['apolice'][$coluna];
                    $origem[$coluna] = $linha;
                } elseif ($escolhidos[$coluna] != $item['apolice'][$coluna]) {
                    $plano->aviso($linha, "A apólice {$numeroApolice} tem {$rotulo} diferente na linha {$origem[$coluna]} — foi usado o valor da linha {$origem[$coluna]}.");
                }
            }
        }

        return $escolhidos;
    }

    /**
     * Maior entre: quantas parcelas existem, o maior número de parcela e o
     * total informado no formato "3/12".
     *
     * @param  array<int, float>  $valores  número da parcela => valor
     */
    private function quantidadeParcelas(array $valores, array $parcelasPlanilha): int
    {
        $totais = array_filter(array_column($parcelasPlanilha, 'total'));

        return max(count($valores), max(array_keys($valores) ?: [0]), $totais === [] ? 0 : max($totais));
    }

    /**
     * Soma das parcelas, se todas estão presentes; senão, a média vezes o
     * total de parcelas (estimativa).
     *
     * @param  array<int, float>  $valores
     */
    private function estimarPremio(array $valores, ?int $quantidade): ?float
    {
        if ($valores === []) {
            return null;
        }

        $soma = array_sum($valores);

        return ! $quantidade || $quantidade === count($valores)
            ? round($soma, 2)
            : round($soma / count($valores) * $quantidade, 2);
    }

    /**
     * Uma parcela por linha. Parcela já paga no sistema nunca volta a ficar
     * em aberto pela importação (isso é estorno, feito na tela Pagamentos).
     * Parcela paga na planilha gera também o lançamento em Pagamentos — sem
     * ele, a parcela aparecia para pagar de novo e ficava fora do "Total
     * recebido".
     */
    private function planejarParcelas(array $itens, array $apolicesBanco, array $parcelasBanco, array $pagamentosBanco, string $hoje, PlanoImportacao $plano): void
    {
        $semForma = 0;

        foreach ($itens as $linha => $item) {
            $p = $item['parcela'];
            $numeroApolice = $item['apolice']['numero'];
            $apolice = $apolicesBanco[$numeroApolice] ?? null;
            $statusAberto = $p['vencimento'] < $hoje ? 'vencida' : 'em_aberto';
            $forma = null;

            if ($p['paga']) {
                $forma = $item['apolice']['forma_pagamento']
                    ?? $plano->apolicesNovas[$numeroApolice]['forma_pagamento']
                    ?? $this->normalizar->formaPagamento((string) $apolice?->forma_pagamento);

                if ($forma === null) {
                    $forma = 'boleto';
                    $semForma++;
                }
            }

            $existente = $apolice ? ($parcelasBanco[$apolice->id][$p['numero']] ?? null) : null;

            if ($existente !== null) {
                $jaPaga = $existente->status_pagamento === 'paga' || isset($pagamentosBanco[$apolice->id.'|'.$p['numero']]);

                if ($jaPaga) {
                    if (! $p['paga']) {
                        $plano->aviso($linha, "A parcela {$p['numero']} da apólice {$numeroApolice} já está paga no sistema e continua paga (para desfazer, estorne o pagamento na tela Pagamentos).");
                    } elseif ((float) $existente->valor_parcela !== (float) $p['valor'] || $existente->getRawOriginal('data_vencimento') !== $p['vencimento']) {
                        $plano->aviso($linha, "A parcela {$p['numero']} da apólice {$numeroApolice} já está paga no sistema — valor e vencimento não foram alterados.");
                    }

                    $plano->parcelasSemMudanca++;
                    $plano->linhasValidas++;

                    continue;
                }

                $campos = [];
                if ((float) $existente->valor_parcela !== (float) $p['valor']) {
                    $campos['valor_parcela'] = $p['valor'];
                }
                if ($existente->getRawOriginal('data_vencimento') !== $p['vencimento']) {
                    $campos['data_vencimento'] = $p['vencimento'];
                }

                if ($p['paga']) {
                    $campos += ['status_pagamento' => 'paga', 'data_pagamento' => $p['data_pagamento'], 'forma_pagamento_efetiva' => $forma];
                    $this->planejarPagamento($numeroApolice, $p, $forma, $linha, $plano);
                } elseif ($existente->status_pagamento !== $statusAberto) {
                    $campos['status_pagamento'] = $statusAberto;
                }

                if ($campos !== []) {
                    $plano->parcelasAtualizadas[$existente->id] = $campos;
                } else {
                    $plano->parcelasSemMudanca++;
                }

                $plano->linhasValidas++;

                continue;
            }

            $plano->parcelasNovas[] = [
                'numero_apolice' => $numeroApolice,
                'numero_parcela' => $p['numero'],
                'valor_parcela' => $p['valor'],
                'data_vencimento' => $p['vencimento'],
                'status_pagamento' => $p['paga'] ? 'paga' : $statusAberto,
                'data_pagamento' => $p['data_pagamento'],
                'forma_pagamento_efetiva' => $forma,
            ];

            if ($p['paga']) {
                $this->planejarPagamento($numeroApolice, $p, $forma, $linha, $plano);
            }

            $plano->linhasValidas++;
        }

        if ($semForma > 0) {
            $plano->aviso(null, "{$semForma} parcela(s) paga(s) sem forma de pagamento foram registradas como boleto. Para outra forma, preencha a coluna \"Forma de Pagamento\".");
        }
    }

    private function planejarPagamento(string $numeroApolice, array $parcela, string $forma, int $linha, PlanoImportacao $plano): void
    {
        // O banco exige pagamento com valor maior que zero.
        if ($parcela['valor'] <= 0) {
            $plano->aviso($linha, "A parcela {$parcela['numero']} da apólice {$numeroApolice} tem valor zero: ficou marcada como paga, sem lançamento em Pagamentos.");

            return;
        }

        $plano->pagamentosNovos[] = [
            'numero_apolice' => $numeroApolice,
            'parcela' => $parcela['numero'],
            'valor' => $parcela['valor'],
            'data_pagamento' => $parcela['data_pagamento'],
            'forma_pagamento' => $forma,
        ];
    }

    /**
     * Compara os campos com o que está gravado (valor cru do banco) e devolve
     * só o que mudou, mais os valores anteriores (para a auditoria).
     *
     * @return array{0: array<string, mixed>, 1: array<string, mixed>}
     */
    private function diferencas($registro, array $campos): array
    {
        $mudou = [];
        $antes = [];

        foreach ($campos as $coluna => $valor) {
            $atual = $registro->getRawOriginal($coluna);
            $iguais = is_float($valor) || in_array($coluna, ['valor_premio_total', 'valor_cobertura'], true)
                ? $atual !== null && (float) $atual === (float) $valor
                : (string) $atual === (string) $valor;

            if (! $iguais) {
                $mudou[$coluna] = $valor;
                $antes[$coluna] = $atual;
            }
        }

        return [$mudou, $antes];
    }

    /* ------------------------------------------------------------------ */
    /* Fase 2: gravação (dentro de DB::transaction)                       */
    /* ------------------------------------------------------------------ */

    /**
     * Grava o plano em lote: inserts de vários registros por consulta e
     * updates só do que mudou. Como passa pelo query builder (sem eventos do
     * Eloquent), a auditoria é montada aqui e gravada de uma vez no fim.
     */
    private function executar(PlanoImportacao $plano, string $nomeArquivo, ?int $usuarioId): void
    {
        $agora = now();
        $ip = app()->runningInConsole() ? null : request()->ip();
        $auditoria = [];
        $registrar = function (string $acao, string $modulo, string $tipo, int $id, string $descricao, ?array $alteracoes) use (&$auditoria, $usuarioId, $ip, $agora) {
            $auditoria[] = [
                'user_id' => $usuarioId, 'acao' => $acao, 'modulo' => $modulo, 'auditavel_type' => $tipo,
                'auditavel_id' => $id, 'descricao' => mb_substr($descricao, 0, 255), 'alteracoes' => $alteracoes,
                'ip' => $ip, 'created_at' => $agora,
            ];
        };
        $tipoSegurado = (new Segurado)->getMorphClass();
        $tipoApolice = (new Apolice)->getMorphClass();
        $tipoPagamento = (new Pagamento)->getMorphClass();

        // 1) Clientes
        $idsClientes = $plano->clientesExistentes;

        if ($plano->clientesNovos !== []) {
            $this->inserirEmLote('segurados', self::COLUNAS_SEGURADO, array_values($plano->clientesNovos), $agora);
            $porDocumento = $this->idsPor('segurados', 'cpf_cnpj', array_column($plano->clientesNovos, 'cpf_cnpj'));

            foreach ($plano->clientesNovos as $digitos => $cliente) {
                $idsClientes[$digitos] = $porDocumento[$cliente['cpf_cnpj']];
                $registrar('criou', 'Cliente', $tipoSegurado, $idsClientes[$digitos], $cliente['nome_completo'], $this->valoresIniciais($cliente));
            }
        }

        foreach ($plano->clientesAtualizados as $id => $alteracao) {
            DB::table('segurados')->where('id', $id)->update($alteracao['campos'] + ['updated_at' => $agora]);
            $registrar('editou', 'Cliente', $tipoSegurado, $id, $alteracao['nome'], $this->deParaDe($alteracao));
        }

        // 2) Apólices
        $idsApolices = $plano->apolicesExistentes;

        if ($plano->apolicesNovas !== []) {
            $linhas = [];
            foreach ($plano->apolicesNovas as $apolice) {
                $apolice['cliente_id'] = $idsClientes[$apolice['cliente_digitos']];
                unset($apolice['cliente_digitos']);
                $linhas[] = $apolice;
            }

            $this->inserirEmLote('apolices', self::COLUNAS_APOLICE, $linhas, $agora);
            $porNumero = $this->idsPor('apolices', 'numero_apolice', array_keys($plano->apolicesNovas));
            $nomes = [];
            foreach ($plano->clientesNovos as $c) {
                $nomes[$c['cpf_cnpj']] = $c['nome_completo'];
            }

            foreach ($plano->apolicesNovas as $numero => $apolice) {
                $idsApolices[$numero] = $porNumero[$numero];
                $nome = $nomes[$this->normalizar->formatarDocumento($apolice['cliente_digitos'])] ?? null;
                $registrar('criou', 'Apólice', $tipoApolice, $idsApolices[$numero], "Apólice {$numero}".($nome ? " — {$nome}" : ''), $this->valoresIniciais(array_diff_key($apolice, ['cliente_digitos' => true])));
            }
        }

        foreach ($plano->apolicesAtualizadas as $id => $alteracao) {
            DB::table('apolices')->where('id', $id)->update($alteracao['campos'] + ['updated_at' => $agora]);
            $registrar('editou', 'Apólice', $tipoApolice, $id, "Apólice {$alteracao['numero']} — {$alteracao['cliente']}", $this->deParaDe($alteracao));
        }

        // 3) Parcelas
        if ($plano->parcelasNovas !== []) {
            $linhas = array_map(function ($p) use ($idsApolices) {
                $p['apolice_id'] = $idsApolices[$p['numero_apolice']];
                unset($p['numero_apolice']);

                return $p;
            }, $plano->parcelasNovas);

            $this->inserirEmLote('parcelas', self::COLUNAS_PARCELA, $linhas, $agora);
        }

        foreach ($plano->parcelasAtualizadas as $id => $campos) {
            DB::table('parcelas')->where('id', $id)->update($campos + ['updated_at' => $agora]);
        }

        // 4) Pagamentos das parcelas pagas
        if ($plano->pagamentosNovos !== []) {
            $observacao = mb_substr("Importado da planilha \"{$nomeArquivo}\"", 0, 1000);
            $linhas = array_map(fn ($p) => [
                'apolice_id' => $idsApolices[$p['numero_apolice']],
                'parcela' => $p['parcela'],
                'valor' => $p['valor'],
                'data_pagamento' => $p['data_pagamento'],
                'forma_pagamento' => $p['forma_pagamento'],
                'status' => 'confirmado',
                'observacoes' => $observacao,
                'registrado_por' => $usuarioId,
            ], $plano->pagamentosNovos);

            $this->inserirEmLote('pagamentos', array_keys($linhas[0]), $linhas, $agora);

            $ids = [];
            foreach (array_chunk(array_values(array_unique(array_column($linhas, 'apolice_id'))), 500) as $lote) {
                foreach (DB::table('pagamentos')->whereNull('deleted_at')->whereIn('apolice_id', $lote)->get(['id', 'apolice_id', 'parcela']) as $r) {
                    $ids[$r->apolice_id.'|'.$r->parcela] = $r->id;
                }
            }

            foreach ($plano->pagamentosNovos as $p) {
                $idApolice = $idsApolices[$p['numero_apolice']];
                $valor = number_format($p['valor'], 2, ',', '.');
                $registrar('criou', 'Pagamento', $tipoPagamento, $ids[$idApolice.'|'.$p['parcela']], "{$p['parcela']}ª parcela — apólice {$p['numero_apolice']} — R$ {$valor}", null);
            }
        }

        $this->auditoria->registrarEmLote($auditoria);

        if ($usuarioId !== null) {
            HistoricoImportacao::create([
                'nome_arquivo' => mb_substr($nomeArquivo, 0, 255),
                'tipo_importacao' => 'segurados',
                'usuario_id' => $usuarioId,
            ]);
        }
    }

    /**
     * INSERT de vários registros por consulta. Todas as linhas precisam das
     * mesmas colunas, então as ausentes vão como null.
     *
     * @param  array<int, string>  $colunas
     * @param  array<int, array<string, mixed>>  $linhas
     */
    private function inserirEmLote(string $tabela, array $colunas, array $linhas, $agora): void
    {
        $completas = array_map(function ($linha) use ($colunas, $agora) {
            $completa = [];
            foreach ($colunas as $coluna) {
                $completa[$coluna] = $linha[$coluna] ?? null;
            }

            return $completa + ['created_at' => $agora, 'updated_at' => $agora];
        }, $linhas);

        foreach (array_chunk($completas, 300) as $lote) {
            DB::table($tabela)->insert($lote);
        }
    }

    /**
     * Ids dos registros vivos recém-inseridos, pela chave única.
     *
     * @return array<string, int>
     */
    private function idsPor(string $tabela, string $coluna, array $valores): array
    {
        $ids = [];

        foreach (array_chunk(array_values($valores), 500) as $lote) {
            $ids += DB::table($tabela)->whereNull('deleted_at')->whereIn($coluna, $lote)->pluck('id', $coluna)->all();
        }

        return $ids;
    }

    private function valoresIniciais(array $campos): array
    {
        $alteracoes = [];

        foreach ($campos as $coluna => $valor) {
            if ($valor !== null && $valor !== '') {
                $alteracoes[$coluna] = ['de' => null, 'para' => $valor];
            }
        }

        return $alteracoes;
    }

    private function deParaDe(array $alteracao): array
    {
        $alteracoes = [];

        foreach ($alteracao['campos'] as $coluna => $valor) {
            $alteracoes[$coluna] = ['de' => $alteracao['antes'][$coluna] ?? null, 'para' => $valor];
        }

        return $alteracoes;
    }

    /* ------------------------------------------------------------------ */
    /* Modelo para download                                               */
    /* ------------------------------------------------------------------ */

    /**
     * CSV do botão "Baixar modelo". Os exemplos usam a primeira seguradora com
     * ramo cadastrada, então o modelo importa sem erro (o arquivo fixo antigo
     * tinha CPFs inválidos e ramos inexistentes: 0 de 4 linhas entravam).
     * Separador ";" e BOM UTF-8 para o Excel em português abrir com as
     * colunas separadas e os acentos certos.
     */
    public function modeloCsv(): string
    {
        $seguradora = Seguradora::with('ramos')->get()->first(fn ($s) => $s->ramos->isNotEmpty());
        $nomeSeguradora = $seguradora?->nome_fantasia ?? 'Porto Seguro';
        $nomeRamo = $seguradora?->ramos->first()->nome_ramo ?? 'Carro';

        // Início há dois meses: a 1ª parcela (paga) venceu no mês passado,
        // então a data de pagamento do exemplo nunca fica no futuro.
        $inicio = CarbonImmutable::today()->startOfMonth()->subMonths(2);
        $fim = $inicio->addYear();
        $d = fn (CarbonImmutable $data) => $data->format('d/m/Y');

        $colunas = [
            'nome_completo', 'cpf_cnpj', 'email', 'celular_whatsapp', 'seguradora', 'ramo', 'numero_apolice',
            'numero_parcela', 'valor_parcela', 'data_vencimento', 'status_pagamento', 'data_pagamento',
            'forma_pagamento', 'inicio_vigencia', 'fim_vigencia',
        ];

        $linhas = [
            ['(EXEMPLO) Maria da Silva', '529.982.247-25', 'maria.exemplo@email.com', '(11) 98765-4321', $nomeSeguradora, $nomeRamo, 'EXEMPLO-0001', '1', '189,90', $d($inicio->addMonth()->setDay(10)), 'Pago', $d($inicio->addMonth()->setDay(10)), 'Pix', $d($inicio), $d($fim)],
            ['(EXEMPLO) Maria da Silva', '529.982.247-25', 'maria.exemplo@email.com', '(11) 98765-4321', $nomeSeguradora, $nomeRamo, 'EXEMPLO-0001', '2', '189,90', $d($inicio->addMonths(2)->setDay(10)), '', '', 'Pix', $d($inicio), $d($fim)],
            ['(EXEMPLO) Comércio Ltda', '11.222.333/0001-81', 'contato@exemplo.com.br', '(11) 3333-4444', $nomeSeguradora, $nomeRamo, 'EXEMPLO-0002', '1', '1.250,00', $d($inicio->addMonths(3)->setDay(15)), '', '', 'Boleto', $d($inicio), $d($fim)],
        ];

        $saida = fopen('php://temp', 'r+');
        fwrite($saida, "\xEF\xBB\xBF");
        fputcsv($saida, array_map(fn ($c) => self::NOMES_COLUNAS[$c], $colunas), ';', '"', '');

        foreach ($linhas as $linha) {
            fputcsv($saida, $linha, ';', '"', '');
        }

        rewind($saida);
        $csv = stream_get_contents($saida);
        fclose($saida);

        return $csv;
    }

    /* ------------------------------------------------------------------ */
    /* Resumo para a tela                                                 */
    /* ------------------------------------------------------------------ */

    private function resumo(PlanoImportacao $plano, bool $simulacao): array
    {
        $ordenar = function (array $mensagens) {
            usort($mensagens, fn ($a, $b) => ($a['linha'] ?? 0) <=> ($b['linha'] ?? 0));

            return $mensagens;
        };

        $linhasComErro = count(array_unique(array_filter(array_column($plano->erros, 'linha'), fn ($l) => $l !== null)));

        return [
            'simulacao' => $simulacao,
            'erroGeral' => $plano->erroGeral,
            'total' => $plano->total,
            'validas' => $plano->linhasValidas,
            'comErro' => $linhasComErro,
            'importados' => ! $simulacao && $plano->gravado ? $plano->linhasValidas : 0,
            'contagem' => [
                'clientesNovos' => count($plano->clientesNovos),
                'clientesAtualizados' => count($plano->clientesAtualizados),
                'apolicesNovas' => count($plano->apolicesNovas),
                'apolicesAtualizadas' => count($plano->apolicesAtualizadas),
                'parcelasNovas' => count($plano->parcelasNovas),
                'parcelasAtualizadas' => count($plano->parcelasAtualizadas),
                'parcelasSemMudanca' => $plano->parcelasSemMudanca,
                'pagamentosRegistrados' => count($plano->pagamentosNovos),
            ],
            'erros' => array_slice($ordenar($plano->erros), 0, self::MAX_MENSAGENS),
            'totalErros' => count($plano->erros),
            'avisos' => array_slice($ordenar($plano->avisos), 0, self::MAX_MENSAGENS),
            'totalAvisos' => count($plano->avisos),
            'seguradorasFaltantes' => array_values($plano->seguradorasFaltantes),
            'ramosFaltantes' => array_values($plano->ramosFaltantes),
        ];
    }
}
