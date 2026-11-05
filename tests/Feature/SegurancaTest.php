<?php

use App\Http\Controllers\Controller;
use App\Models\Segurado;
use App\Models\User;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Support\Facades\Exceptions;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Facades\Vite;

// Só as migrations de que estes testes precisam: várias das antigas usam SQL
// exclusivo do Postgres e não rodam no SQLite em memória do phpunit.xml.
beforeEach(function () {
    $this->artisan('migrate:fresh', [
        '--path' => array_map(fn ($m) => "database/migrations/{$m}.php", [
            '0001_01_01_000000_create_users_table',
            '2025_08_14_170933_add_two_factor_columns_to_users_table',
            '2026_05_05_200001_create_seguradoras_table',
            '2026_05_05_200002_create_ramos_table.php', // o arquivo é ".php.php"
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
            '2026_10_27_120000_create_auditorias_table',
            // Não faz nada fora do Supabase — garante que não quebra o SQLite.
            '2026_11_04_150000_bloquear_api_publica_do_supabase',
        ]),
    ]);

    $this->cliente = Segurado::create([
        'nome_completo' => 'Cliente Teste',
        'tipo_pessoa' => 'PF',
        'cpf_cnpj' => '52998224725',
        'email' => 'cliente@teste.com',
    ]);
});

test('atendente não exclui nem restaura cliente (excluir cancela as apólices)', function () {
    $atendente = User::factory()->create(['role' => 'user']);

    $this->actingAs($atendente)
        ->delete("/clientes/{$this->cliente->id}")
        ->assertRedirect(route('dashboard'));

    expect($this->cliente->fresh()->trashed())->toBeFalse();

    $this->cliente->delete();

    $this->actingAs($atendente)
        ->patch("/clientes/restaurar/{$this->cliente->id}")
        ->assertRedirect(route('dashboard'));

    expect(Segurado::withTrashed()->find($this->cliente->id)->trashed())->toBeTrue();
});

test('admin continua excluindo cliente', function () {
    $this->actingAs(User::factory()->create(['role' => 'admin']))
        ->delete("/clientes/{$this->cliente->id}");

    expect(Segurado::withTrashed()->find($this->cliente->id)->trashed())->toBeTrue();
});

test('erro de banco não chega na tela; erro de regra de negócio chega', function () {
    Exceptions::fake();

    $controller = new class extends Controller
    {
        public function texto(\Throwable $e, ?string $prefixo = null): string
        {
            return $this->mensagemErro($e, $prefixo);
        }
    };

    $sql = new \Exception('Erro ao cadastrar apólice: SQLSTATE[23505]: Unique violation: 7 ERROR: duplicate key value violates unique constraint "apolices_numero_apolice_unique" (Connection: pgsql, SQL: insert into "apolices" ...)');
    $texto = $controller->texto($sql, 'Erro ao cadastrar apólice');

    expect($texto)->toStartWith('Erro ao cadastrar apólice: não foi possível concluir')
        ->not->toContain('SQLSTATE')
        ->not->toContain('apolices_numero_apolice_unique');
    Exceptions::assertReported(fn (\Exception $e) => $e === $sql);

    expect($controller->texto(new \Exception('O prêmio informado não cobre as parcelas.'), 'Erro ao atualizar apólice'))
        ->toBe('Erro ao atualizar apólice: O prêmio informado não cobre as parcelas.');

    expect($controller->texto(new \TypeError('App\Services\X::y(): Argument #1 must be of type int, called in /var/www/html/app/Http/Foo.php on line 9')))
        ->not->toContain('/var/www');
});

test('cabeçalhos de segurança, CSP com nonce e o script do tema com o mesmo nonce', function () {
    // Simula o build de produção mesmo com o `npm run dev` rodando nesta máquina.
    Vite::useHotFile(storage_path('framework/testing/nao-existe.hot'));
    User::factory()->create(); // sem nenhum usuário, /login manda para a configuração inicial

    $resposta = $this->get('/login')->assertOk();
    $csp = $resposta->headers->get('Content-Security-Policy');

    expect($csp)->toContain("default-src 'self'")
        ->toContain("frame-ancestors 'none'")
        ->toContain("object-src 'none'");

    preg_match("/'nonce-([^']+)'/", $csp, $m);
    expect($m[1] ?? '')->not->toBe('');
    $resposta->assertSee('nonce="'.$m[1].'"', false);

    $resposta->assertHeader('X-Frame-Options', 'DENY')
        ->assertHeader('X-Content-Type-Options', 'nosniff')
        ->assertHeader('Cross-Origin-Opener-Policy', 'same-origin')
        ->assertHeaderMissing('X-Powered-By');
    expect($resposta->headers->get('Permissions-Policy'))->toContain('camera=()');
});

test('cookie de tema adulterado não vira código na página', function () {
    User::factory()->create();

    $this->withUnencryptedCookie('appearance', "x';alert(document.cookie);//")
        ->get('/login')
        ->assertDontSee('alert(document.cookie)', false)
        ->assertSee("const appearance = 'system'", false);
});

test('"esqueci a senha" responde igual para e-mail com e sem conta', function () {
    Notification::fake();
    $user = User::factory()->create();
    $esperado = trans(Password::RESET_LINK_SENT);

    $this->post(route('password.email'), ['email' => $user->email])
        ->assertSessionHas('status', $esperado)
        ->assertSessionHasNoErrors();

    $this->post(route('password.email'), ['email' => 'ninguem@naoexiste.com'])
        ->assertSessionHas('status', $esperado)
        ->assertSessionHasNoErrors();

    Notification::assertSentTo($user, ResetPassword::class);
    Notification::assertSentTimes(ResetPassword::class, 1);
});

test('login: o mesmo IP não testa senha em dezenas de contas', function () {
    foreach (range(1, 30) as $i) {
        $this->post('/login', ['email' => "conta{$i}@teste.com", 'password' => 'Senha123!']);
    }

    $this->post('/login', ['email' => 'conta31@teste.com', 'password' => 'Senha123!'])
        ->assertStatus(429);
});
