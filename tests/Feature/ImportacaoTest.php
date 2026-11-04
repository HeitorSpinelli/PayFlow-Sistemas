<?php

use App\Models\Apolice;
use App\Models\Pagamento;
use App\Models\Parcelas;
use App\Models\Ramo;
use App\Models\Segurado;
use App\Models\Seguradora;
use App\Models\User;
use App\Services\Importacoes\ImportacaoSeguradosService;
use App\Services\Importacoes\LeitorPlanilha;
use App\Services\Importacoes\NormalizadorImportacao;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;

// Só as migrations de que estes testes precisam: várias das antigas usam SQL
// exclusivo do Postgres e não rodam no SQLite em memória do phpunit.xml.
beforeEach(function () {
    $this->artisan('migrate:fresh', [
        '--path' => array_map(fn ($m) => "database/migrations/{$m}.php", [
            '0001_01_01_000000_create_users_table',
            '2025_08_14_170933_add_two_factor_columns_to_users_table',
            '2026_05_05_200001_create_seguradoras_table',
            '2026_05_05_200002_create_ramos_table.php',
            '2026_09_03_010000_add_categoria_to_ramos_table',
            '2026_05_05_230000_create_segurados_table',
            '2026_08_25_140139_add_deleted_at_to_segurados_table',
            '2026_08_28_040254_add_bairro_to_segurados_table',
            '2026_08_28_040933_fix_coluna_bairro_segurados_table',
            '2026_09_03_020000_add_razao_social_to_segurados_table',
            '2026_05_05_235315_create_apolices_table',
            '2026_08_25_140140_add_deleted_at_to_apolices_table',
            '2026_09_01_012240_drop_status_from_apolices_table',
            '2026_09_09_100000_add_suspensa_em_to_apolices_table',
            '2026_09_10_231203_add_motivo_cancelamento_to_apolices_table',
            '2026_05_06_001331_create_parcelas_table',
            '2026_08_27_150000_add_deleted_at_to_parcelas_table',
            '2026_05_12_004928_create_historico_importacoes_table',
            '2026_06_27_152518_create_pagamentos_table',
            '2026_08_27_150001_add_deleted_at_to_pagamentos_table',
            '2026_09_04_120000_make_pagamentos_unique_index_partial',
            '2026_09_21_233108_adiciona_rastro_de_autoria_em_pagamentos',
            '2026_10_27_120000_create_auditorias_table',
        ]),
    ]);

    $this->admin = User::factory()->create(['role' => 'admin']);
    $porto = Seguradora::create(['nome_fantasia' => 'Porto Seguro', 'razao_social' => 'Porto Seguro S.A', 'cnpj' => '61198164000160']);
    Ramo::create(['nome_ramo' => 'Carro', 'categoria' => 'veiculo', 'seguradora_id' => $porto->id]);
    Ramo::create(['nome_ramo' => 'Caminhão', 'categoria' => 'veiculo', 'seguradora_id' => $porto->id]);
    $this->service = app(ImportacaoSeguradosService::class);
});

function csvTemporario(string $conteudo, string $nome = 'planilha.csv'): string
{
    $caminho = sys_get_temp_dir().DIRECTORY_SEPARATOR.uniqid().'-'.$nome;
    file_put_contents($caminho, $conteudo);

    return $caminho;
}

/* ---------------------------------------------------------------- */
/* Normalizador                                                     */
/* ---------------------------------------------------------------- */

test('datas: DD/MM/AAAA é dia/mês, aceita ISO, ano curto e número de série do Excel', function () {
    $n = new NormalizadorImportacao;

    expect($n->data('03/09/2026'))->toBe('2026-09-03')
        ->and($n->data('3/9/26'))->toBe('2026-09-03')
        ->and($n->data('2026-09-03'))->toBe('2026-09-03')
        ->and($n->data('03/09/2026 00:00:00'))->toBe('2026-09-03')
        ->and($n->data('46023'))->toBe('2026-01-01')
        ->and($n->data('31/02/2026'))->toBeNull()
        ->and($n->data('2026-010-10'))->toBeNull()
        ->and($n->data('amanhã'))->toBeNull();
});

test('dinheiro: formato brasileiro e americano, "2.500" é dois mil e quinhentos', function () {
    $n = new NormalizadorImportacao;

    expect($n->dinheiro('1.234,56'))->toBe(1234.56)
        ->and($n->dinheiro('R$ 189,90'))->toBe(189.9)
        ->and($n->dinheiro('342.5'))->toBe(342.5)
        ->and($n->dinheiro('1,234.56'))->toBe(1234.56)
        ->and($n->dinheiro('2.500'))->toBe(2500.0)
        ->and($n->dinheiro('abc'))->toBeNull();
});

test('documento: recupera o zero à esquerda que o Excel apaga e explica notação científica', function () {
    $n = new NormalizadorImportacao;

    expect($n->documento('1234567890')['digitos'])->toBe('01234567890')
        ->and($n->documento('529.982.247-25')['digitos'])->toBe('52998224725')
        ->and($n->documento('11.222.333/0001-81')['digitos'])->toBe('11222333000181')
        ->and($n->documento('111.111.111-12')['erro'])->toContain('inválido')
        ->and($n->documento('1,12223E+13')['erro'])->toContain('notação científica');
});

test('status, forma de pagamento, parcela, UF e telefone', function () {
    $n = new NormalizadorImportacao;

    expect($n->pago('Pago'))->toBeTrue()
        ->and($n->pago('QUITADA'))->toBeTrue()
        ->and($n->pago('Em aberto'))->toBeFalse()
        ->and($n->pago(''))->toBeFalse()
        ->and($n->pago('talvez'))->toBeNull()
        ->and($n->formaPagamento('Cartão de crédito'))->toBe('cartão')
        ->and($n->formaPagamento('Débito automático'))->toBe('débito')
        ->and($n->parcela('3/12'))->toBe([3, 12])
        ->and($n->parcela('2ª'))->toBe([2, null])
        ->and($n->parcela('zero'))->toBeNull()
        ->and($n->uf('São Paulo'))->toBe('SP')
        ->and($n->telefone('+55 11 98765-4321'))->toBe('(11) 98765-4321');
});

/* ---------------------------------------------------------------- */
/* Leitor                                                           */
/* ---------------------------------------------------------------- */

test('todo nome de coluna do modelo é reconhecido pelo leitor', function () {
    foreach (ImportacaoSeguradosService::NOMES_COLUNAS as $coluna => $nome) {
        expect(LeitorPlanilha::colunaCanonica($nome))->toBe($coluna, "\"{$nome}\" deveria virar {$coluna}");
    }

    expect(LeitorPlanilha::colunaCanonica('Nº Apólice'))->toBe('numero_apolice')
        ->and(LeitorPlanilha::colunaCanonica('Valor (R$)'))->toBe('valor_parcela')
        ->and(LeitorPlanilha::colunaCanonica('CPF'))->toBe('cpf_cnpj')
        ->and(LeitorPlanilha::colunaCanonica('Coluna Qualquer'))->toBeNull();
});

test('lê CSV do Excel em português: ";" e acentos em Windows-1252', function () {
    $csv = mb_convert_encoding("Nome;CPF;Situação\r\nJoão Ação;529.982.247-25;Pago\r\n;;\r\n", 'Windows-1252', 'UTF-8');
    $leitura = (new LeitorPlanilha)->ler(csvTemporario($csv));

    expect($leitura['erro'])->toBeNull()
        ->and($leitura['linhas'])->toBe([2 => ['nome_completo' => 'João Ação', 'cpf_cnpj' => '529.982.247-25', 'status_pagamento' => 'Pago']]);
});

test('lê .xlsx de verdade, com texto, número e data do Excel', function () {
    $caminho = sys_get_temp_dir().DIRECTORY_SEPARATOR.uniqid().'.xlsx';
    $zip = new ZipArchive;
    $zip->open($caminho, ZipArchive::CREATE);
    $zip->addFromString('xl/workbook.xml', '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="A" sheetId="1" r:id="rId1"/></sheets></workbook>');
    $zip->addFromString('xl/_rels/workbook.xml.rels', '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Target="worksheets/sheet1.xml"/></Relationships>');
    $zip->addFromString('xl/sharedStrings.xml', '<sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><si><t>Nome</t></si><si><t>Vencimento</t></si><si><t>Maria</t></si></sst>');
    $zip->addFromString('xl/worksheets/sheet1.xml', '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData><row r="1"><c r="A1" t="s"><v>0</v></c><c r="B1" t="s"><v>1</v></c><c r="C1" t="inlineStr"><is><t>CNPJ</t></is></c></row><row r="2"><c r="A2" t="s"><v>2</v></c><c r="B2"><v>46023</v></c><c r="C2"><v>1.1222333000181E+13</v></c></row></sheetData></worksheet>');
    $zip->close();

    $leitura = (new LeitorPlanilha)->ler($caminho);

    expect($leitura['erro'])->toBeNull()
        ->and($leitura['linhas'][2])->toBe(['nome_completo' => 'Maria', 'data_vencimento' => '46023', 'cpf_cnpj' => '11222333000181']);
});

test('recusa .xls antigo com explicação', function () {
    $leitura = (new LeitorPlanilha)->ler(csvTemporario("\xD0\xCF\x11\xE0\xA1\xB1\x1A\xE1resto"));

    expect($leitura['erro'])->toContain('.xls');
});

/* ---------------------------------------------------------------- */
/* Importação                                                       */
/* ---------------------------------------------------------------- */

test('o modelo baixado da tela importa sem erro, com vigência e pagamento', function () {
    $resumo = $this->service->importar(csvTemporario($this->service->modeloCsv()), 'modelo.csv', $this->admin->id);

    expect($resumo['erroGeral'])->toBeNull()
        ->and($resumo['importados'])->toBe(3)
        ->and($resumo['totalErros'])->toBe(0)
        ->and(Segurado::count())->toBe(2)
        ->and(Parcelas::count())->toBe(3)
        ->and(Pagamento::count())->toBe(1);

    $apolice = Apolice::where('numero_apolice', 'EXEMPLO-0001')->first();
    expect($apolice->fim_vigencia)->not->toBeNull()
        ->and($apolice->quantidade_parcelas)->toBe(2)
        ->and((float) $apolice->valor_premio_total)->toBe(379.8);

    $pago = Parcelas::where('status_pagamento', 'paga')->first();
    expect($pago->data_pagamento)->not->toBeNull()
        ->and($pago->forma_pagamento_efetiva)->toBe('pix');
});

test('a prévia não grava nada', function () {
    $previa = $this->service->verificar(csvTemporario($this->service->modeloCsv()), 'modelo.csv');

    expect($previa['simulacao'])->toBeTrue()
        ->and($previa['validas'])->toBe(3)
        ->and($previa['contagem']['clientesNovos'])->toBe(2)
        ->and(Segurado::count())->toBe(0)
        ->and(Parcelas::count())->toBe(0);
});

test('importar a mesma planilha de novo não duplica nada', function () {
    $caminho = csvTemporario($this->service->modeloCsv());
    $this->service->importar($caminho, 'modelo.csv', $this->admin->id);

    $segunda = $this->service->importar($caminho, 'modelo.csv', $this->admin->id);

    expect($segunda['contagem']['parcelasSemMudanca'])->toBe(3)
        ->and($segunda['contagem']['parcelasNovas'])->toBe(0)
        ->and(Segurado::count())->toBe(2)
        ->and(Parcelas::count())->toBe(3)
        ->and(Pagamento::count())->toBe(1);
});

test('linhas com erro ficam de fora com mensagem clara; as boas entram', function () {
    $csv = "Nome;CPF;Seguradora;Ramo;Apólice;Parcela;Valor;Vencimento\n"
        ."Boa;529.982.247-25;porto seguro;caminhao;A-1;1;100,00;10/12/2026\n"
        ."Data Ruim;390.533.447-05;Porto Seguro;Carro;A-2;1;100;31/02/2026\n"
        ."Seguradora Nova;390.533.447-05;Allianz;Auto;A-3;1;100;10/12/2026\n"
        ."Ramo Errado;390.533.447-05;Porto Seguro;Barco;A-4;1;100;10/12/2026\n";

    $resumo = $this->service->importar(csvTemporario($csv), 'erros.csv', $this->admin->id);
    $mensagens = collect($resumo['erros'])->pluck('mensagem', 'linha');

    expect($resumo['importados'])->toBe(1)
        ->and($resumo['comErro'])->toBe(3)
        ->and($mensagens[3])->toContain('31/02/2026')
        ->and($mensagens[4])->toContain('Allianz')
        ->and($mensagens[5])->toContain('ramos cadastrados: Carro, Caminhão')
        ->and($resumo['seguradorasFaltantes'])->toBe(['Allianz'])
        ->and(Apolice::where('numero_apolice', 'A-1')->exists())->toBeTrue();
});

test('não transfere apólice de outro cliente nem importa em cliente excluído', function () {
    $this->service->importar(csvTemporario($this->service->modeloCsv()), 'modelo.csv', $this->admin->id);
    Segurado::where('cpf_cnpj', '11.222.333/0001-81')->first()->delete();

    $csv = "Nome;CPF;Seguradora;Ramo;Apólice;Parcela;Valor;Vencimento\n"
        ."Intruso;390.533.447-05;Porto Seguro;Carro;EXEMPLO-0001;5;100;10/12/2026\n"
        ."Empresa;11.222.333/0001-81;Porto Seguro;Carro;NOVA-9;1;100;10/12/2026\n";

    $resumo = $this->service->importar(csvTemporario($csv), 'conflito.csv', $this->admin->id);
    $mensagens = collect($resumo['erros'])->pluck('mensagem', 'linha');

    expect($resumo['importados'])->toBe(0)
        ->and($mensagens[2])->toContain('já está cadastrada para (EXEMPLO) Maria da Silva')
        ->and($mensagens[3])->toContain('inativo')
        ->and(Apolice::where('numero_apolice', 'EXEMPLO-0001')->first()->cliente->nome_completo)->toBe('(EXEMPLO) Maria da Silva');
});

test('parcela já paga no sistema não volta a ficar em aberto', function () {
    $this->service->importar(csvTemporario($this->service->modeloCsv()), 'modelo.csv', $this->admin->id);

    $csv = "Nome;CPF;Seguradora;Ramo;Apólice;Parcela;Valor;Vencimento;Status\n"
        ."(EXEMPLO) Maria da Silva;529.982.247-25;Porto Seguro;Carro;EXEMPLO-0001;1;189,90;10/12/2026;Em aberto\n";

    $resumo = $this->service->importar(csvTemporario($csv), 'reabrir.csv', $this->admin->id);

    expect(Parcelas::where('numero_parcela', 1)->whereHas('apolice', fn ($q) => $q->where('numero_apolice', 'EXEMPLO-0001'))->first()->status_pagamento)->toBe('paga')
        ->and(collect($resumo['avisos'])->pluck('mensagem')->implode(' '))->toContain('já está paga no sistema');
});

test('a importação registra na auditoria quem criou o quê', function () {
    $this->service->importar(csvTemporario($this->service->modeloCsv()), 'modelo.csv', $this->admin->id);

    $acoes = DB::table('auditorias')->where('user_id', $this->admin->id)->where('acao', 'criou')->pluck('modulo')->countBy();

    expect($acoes['Cliente'])->toBe(2)
        ->and($acoes['Apólice'])->toBe(2)
        ->and($acoes['Pagamento'])->toBe(1);
});

/* ---------------------------------------------------------------- */
/* Rotas                                                            */
/* ---------------------------------------------------------------- */

test('rotas: modelo, prévia em JSON, importação e .xls recusado', function () {
    $this->actingAs($this->admin);

    $modelo = $this->get('/importar/modelo');
    $modelo->assertOk()->assertHeader('Content-Type', 'text/csv; charset=UTF-8');
    expect($modelo->getContent())->toStartWith("\xEF\xBB\xBF");

    $arquivo = fn () => UploadedFile::fake()->createWithContent('modelo.csv', $this->service->modeloCsv());

    $this->postJson('/importar-dados/verificar', ['arquivo' => $arquivo()])
        ->assertOk()
        ->assertJsonPath('validas', 3)
        ->assertJsonPath('simulacao', true);
    expect(Segurado::count())->toBe(0);

    $this->post('/importar-dados', ['arquivo' => $arquivo()])
        ->assertRedirect()
        ->assertSessionHas('importResumo', fn ($r) => $r['importados'] === 3 && $r['arquivo'] === 'modelo.csv');
    expect(Segurado::count())->toBe(2);

    $this->postJson('/importar-dados/verificar', ['arquivo' => UploadedFile::fake()->create('velho.xls', 10)])
        ->assertStatus(422)
        ->assertJsonPath('errors.arquivo.0', fn ($m) => str_contains($m, '.xls'));
});
