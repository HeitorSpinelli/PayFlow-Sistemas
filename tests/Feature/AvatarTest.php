<?php

use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;

// Só as migrations de que estes testes precisam: várias das antigas usam SQL
// exclusivo do Postgres e não rodam no SQLite em memória do phpunit.xml.
beforeEach(function () {
    $this->artisan('migrate:fresh', [
        '--path' => [
            'database/migrations/0001_01_01_000000_create_users_table.php',
            'database/migrations/2025_08_14_170933_add_two_factor_columns_to_users_table.php',
            'database/migrations/2026_10_27_120000_create_auditorias_table.php',
            'database/migrations/2026_11_02_130000_create_fotos_usuarios_table.php',
        ],
    ]);

    // SQLite só respeita ON DELETE CASCADE com foreign keys ligadas.
    DB::statement('PRAGMA foreign_keys = ON');

    $this->user = User::factory()->create();
});

function enviarFoto($teste, $arquivo)
{
    return $teste->actingAs($teste->user)->post('/settings/profile/avatar', ['avatar' => $arquivo]);
}

test('envia a foto, grava no banco e expõe a URL em avatar', function () {
    enviarFoto($this, UploadedFile::fake()->image('eu.jpg', 400, 400))
        ->assertSessionHas('success', 'Foto de perfil atualizada.');

    $this->user->refresh();
    expect(DB::table('fotos_usuarios')->where('user_id', $this->user->id)->count())->toBe(1)
        ->and($this->user->avatar)->toStartWith('/settings/profile/avatar/'.$this->user->id.'?v=')
        ->and($this->user->toArray())->not->toHaveKey('avatar_atualizado_em');
});

test('outro usuário logado vê a foto, com o mesmo conteúdo enviado', function () {
    $imagem = UploadedFile::fake()->image('eu.png', 64, 64);
    $bytes = $imagem->get();
    enviarFoto($this, $imagem);

    $colega = User::factory()->create();
    $resposta = $this->actingAs($colega)->get($this->user->refresh()->avatar);

    $resposta->assertOk()->assertHeader('Content-Type', 'image/png');
    expect($resposta->getContent())->toBe($bytes);
});

test('trocar a foto substitui a anterior e muda a URL (cache)', function () {
    enviarFoto($this, UploadedFile::fake()->image('a.png'));
    $urlAntiga = $this->user->refresh()->avatar;
    $this->travel(2)->seconds();

    enviarFoto($this, UploadedFile::fake()->image('b.jpg'));

    expect(DB::table('fotos_usuarios')->count())->toBe(1)
        ->and(DB::table('fotos_usuarios')->value('mime'))->toBe('image/jpeg')
        ->and($this->user->refresh()->avatar)->not->toBe($urlAntiga);
});

test('recusa arquivo que não é imagem e imagem acima de 2 MB', function () {
    enviarFoto($this, UploadedFile::fake()->create('virus.pdf', 10, 'application/pdf'))->assertSessionHasErrors('avatar');
    enviarFoto($this, UploadedFile::fake()->image('grande.jpg')->size(3000))
        ->assertSessionHasErrors(['avatar' => 'A imagem pode ter no máximo 2 MB.']);

    expect($this->user->refresh()->avatar)->toBeNull()
        ->and(DB::table('fotos_usuarios')->count())->toBe(0);
});

test('remover apaga a foto e volta para as iniciais', function () {
    enviarFoto($this, UploadedFile::fake()->image('a.png'));

    $this->actingAs($this->user)->delete('/settings/profile/avatar')->assertSessionHas('success');

    expect($this->user->refresh()->avatar)->toBeNull()
        ->and(DB::table('fotos_usuarios')->count())->toBe(0);
});

test('a imagem só é servida para quem está logado', function () {
    enviarFoto($this, UploadedFile::fake()->image('a.png'));
    $url = $this->user->refresh()->avatar;

    auth()->logout();
    $this->get($url)->assertRedirect('/login');

    $outro = User::factory()->create();
    $this->actingAs($outro)->get('/settings/profile/avatar/'.$outro->id)->assertNotFound();
});

test('excluir o usuário apaga a foto dele', function () {
    enviarFoto($this, UploadedFile::fake()->image('a.png'));

    $this->user->delete();

    expect(DB::table('fotos_usuarios')->count())->toBe(0);
});
