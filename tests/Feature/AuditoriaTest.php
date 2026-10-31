<?php

use App\Models\Auditoria;
use App\Models\Seguradora;
use App\Models\User;
use App\Services\Auditoria\AuditoriaService;
use Illuminate\Support\Facades\Schema;

// Só as migrations de que estes testes precisam: várias das antigas usam SQL
// exclusivo do Postgres (ALTER COLUMN ... SET DEFAULT) e não rodam no SQLite
// em memória do phpunit.xml.
beforeEach(function () {
    $this->artisan('migrate:fresh', [
        '--path' => [
            'database/migrations/0001_01_01_000000_create_users_table.php',
            'database/migrations/2025_08_14_170933_add_two_factor_columns_to_users_table.php',
            'database/migrations/2026_05_05_200001_create_seguradoras_table.php',
            'database/migrations/2026_10_27_120000_create_auditorias_table.php',
        ],
    ]);
});

function admin(): User
{
    return User::factory()->create(['role' => 'admin']);
}

test('criar, editar e excluir viram linhas no log com o usuário logado', function () {
    $admin = admin();
    $this->actingAs($admin);

    $seguradora = Seguradora::create(['nome_fantasia' => 'Porto', 'cnpj' => '11222333000181']);
    $seguradora->update(['nome_fantasia' => 'Porto Seguro']);
    $seguradora->delete();

    $log = Auditoria::where('modulo', 'Seguradora')->orderBy('id')->get();

    expect($log->pluck('acao')->all())->toBe(['criou', 'editou', 'excluiu'])
        ->and($log->pluck('user_id')->unique()->all())->toBe([$admin->id])
        ->and($log[0]->alteracoes['nome_fantasia'])->toBe(['de' => null, 'para' => 'Porto'])
        ->and($log[1]->alteracoes)->toBe(['nome_fantasia' => ['de' => 'Porto', 'para' => 'Porto Seguro']])
        ->and($log[2]->descricao)->toBe('Porto Seguro');
});

test('edição que só mexe em campos ignorados não é registrada', function () {
    $user = admin();
    $antes = Auditoria::count();

    $user->forceFill(['remember_token' => 'abc'])->save();

    expect(Auditoria::count())->toBe($antes);
});

test('troca de senha aparece sem o valor', function () {
    $user = admin();
    $user->update(['password' => 'nova-senha-123']);

    $registro = Auditoria::where('modulo', 'Usuário')->where('acao', 'editou')->latest('id')->first();

    expect($registro->alteracoes['password'])->toBe(['de' => '••••••', 'para' => '(alterada)'])
        ->and(json_encode($registro->alteracoes))->not->toContain('nova-senha');
});

test('ação sem usuário logado fica como Sistema', function () {
    Seguradora::create(['nome_fantasia' => 'Allianz', 'cnpj' => '11222333000181']);

    expect(Auditoria::where('modulo', 'Seguradora')->first()->user_id)->toBeNull();
});

test('sem a tabela auditorias (migration pendente) o sistema continua salvando', function () {
    Schema::drop('auditorias');
    // Zera o cache estático de tabelaExiste(), preenchido pelos testes anteriores.
    (fn () => self::$tabelaExiste = false)->call(new AuditoriaService);

    $seguradora = Seguradora::create(['nome_fantasia' => 'Tokio', 'cnpj' => '11222333000181']);
    $seguradora->update(['nome_fantasia' => 'Tokio Marine']);

    expect($seguradora->fresh()->nome_fantasia)->toBe('Tokio Marine');
});

test('tela de auditoria é só para admin', function () {
    // bootstrap/app.php transforma todo 403 em redirect para o dashboard.
    $this->actingAs(User::factory()->create(['role' => 'user']))
        ->get('/auditoria')
        ->assertRedirect();

    $this->actingAs(admin())
        ->get('/auditoria?modulo=Usuário')
        ->assertOk();
});
