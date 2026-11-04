<?php

namespace App\Services\Importacoes;

/**
 * Resultado da análise de uma planilha (ImportacaoSeguradosService): o que
 * será criado/alterado, mais os erros e avisos por linha. A prévia da tela
 * Importar mostra isto sem gravar nada; a importação executa as operações.
 */
class PlanoImportacao
{
    /** Erro que impede a planilha inteira (arquivo ilegível, sem colunas...). */
    public ?string $erroGeral = null;

    public int $total = 0;

    public int $linhasValidas = 0;

    public bool $gravado = false;

    /** @var array<int, array{linha: int|null, mensagem: string}> */
    public array $erros = [];

    /** @var array<int, array{linha: int|null, mensagem: string}> */
    public array $avisos = [];

    /** @var array<string, string> chave normalizada => nome como veio na planilha */
    public array $seguradorasFaltantes = [];

    /** @var array<string, array{seguradora: string, ramo: string}> */
    public array $ramosFaltantes = [];

    /** @var array<string, array<string, mixed>> dígitos do CPF/CNPJ => colunas do cliente */
    public array $clientesNovos = [];

    /** @var array<int, array{campos: array<string, mixed>, antes: array<string, mixed>, nome: string}> id => alterações */
    public array $clientesAtualizados = [];

    /** @var array<string, int> dígitos do CPF/CNPJ => id do cliente já cadastrado */
    public array $clientesExistentes = [];

    /** @var array<string, array<string, mixed>> número da apólice => colunas (+ cliente_digitos) */
    public array $apolicesNovas = [];

    /** @var array<int, array{campos: array<string, mixed>, antes: array<string, mixed>, numero: string, cliente: string}> */
    public array $apolicesAtualizadas = [];

    /** @var array<string, int> número da apólice => id já cadastrado */
    public array $apolicesExistentes = [];

    /** @var array<int, array<string, mixed>> parcelas a criar (+ numero_apolice) */
    public array $parcelasNovas = [];

    /** @var array<int, array<string, mixed>> id da parcela => colunas alteradas */
    public array $parcelasAtualizadas = [];

    public int $parcelasSemMudanca = 0;

    /** @var array<int, array<string, mixed>> pagamentos a lançar (+ numero_apolice) */
    public array $pagamentosNovos = [];

    public function erro(?int $linha, string $mensagem): void
    {
        $this->erros[] = ['linha' => $linha, 'mensagem' => $mensagem];
    }

    public function aviso(?int $linha, string $mensagem): void
    {
        $this->avisos[] = ['linha' => $linha, 'mensagem' => $mensagem];
    }
}
