<?php

use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

// Só as migrations de que estes testes precisam: várias das antigas usam SQL
// exclusivo do Postgres e não rodam no SQLite em memória do phpunit.xml.
beforeEach(function () {
    $this->artisan('migrate:fresh', [
        '--path' => [
            'database/migrations/0001_01_01_000000_create_users_table.php',
            'database/migrations/2025_08_14_170933_add_two_factor_columns_to_users_table.php',
            'database/migrations/2026_10_27_120000_create_auditorias_table.php',
            'database/migrations/2026_11_04_120000_add_aceite_termos_to_users_table.php',
        ],
    ]);

    // refresh(): o model recém-criado não traz as colunas que ficaram com o
    // valor padrão (termos_versao). Numa requisição real o usuário vem do
    // banco com todas — e sem a coluna o middleware entende "migration
    // pendente" e não bloqueia.
    $this->user = User::factory()->create(['name' => 'Ana Teste'])->refresh();
});

test('no primeiro acesso a tela recebe os termos como pendentes', function () {
    $this->actingAs($this->user)
        ->get('/settings/profile')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('termos.pendente', true)
            ->where('termos.atualizacao', false)
            ->where('termos.versao', config('termos.versao')));
});

test('enquanto não aceitar, ações que gravam dados são bloqueadas', function () {
    $this->actingAs($this->user)
        ->from('/settings/profile')
        ->patch('/settings/profile', ['name' => 'Outro Nome', 'email' => $this->user->email])
        ->assertRedirect('/settings/profile')
        ->assertSessionHas('error', 'Aceite os termos de uso para continuar.');

    expect($this->user->refresh()->name)->toBe('Ana Teste');
});

test('o aceite exige marcar a caixa e grava versão, data e IP', function () {
    $this->actingAs($this->user)
        ->post('/termos/aceitar', [])
        ->assertSessionHasErrors('aceite');

    $this->actingAs($this->user)
        ->post('/termos/aceitar', ['aceite' => true], ['REMOTE_ADDR' => '10.0.0.7'])
        ->assertSessionHas('success');

    $this->user->refresh();
    expect($this->user->termos_versao)->toBe(config('termos.versao'))
        ->and($this->user->termos_aceitos_em)->not->toBeNull()
        ->and($this->user->termos_aceitos_ip)->toBe('10.0.0.7')
        ->and($this->user->toArray())->not->toHaveKey('termos_aceitos_ip');
});

test('depois do aceite tudo volta a funcionar', function () {
    $this->actingAs($this->user)->post('/termos/aceitar', ['aceite' => true]);

    $this->actingAs($this->user)
        ->get('/settings/profile')
        ->assertInertia(fn (Assert $page) => $page->where('termos.pendente', false));

    $this->actingAs($this->user)
        ->patch('/settings/profile', ['name' => 'Ana Atualizada', 'email' => $this->user->email]);

    expect($this->user->refresh()->name)->toBe('Ana Atualizada');
});

test('nova versão dos termos pede um novo aceite', function () {
    $this->actingAs($this->user)->post('/termos/aceitar', ['aceite' => true]);
    config(['termos.versao' => '2.0']);

    $this->actingAs($this->user)
        ->get('/settings/profile')
        ->assertInertia(fn (Assert $page) => $page
            ->where('termos.pendente', true)
            ->where('termos.atualizacao', true));
});

test('dá para sair do sistema sem aceitar', function () {
    $this->actingAs($this->user)->post('/logout')->assertRedirect();

    $this->assertGuest();
});
