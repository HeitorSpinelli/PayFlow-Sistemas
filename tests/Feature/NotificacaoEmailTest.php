<?php

use App\Mail\NotificacaoMail;
use App\Models\Notificacoes;
use App\Models\Segurado;
use App\Models\TipoNotificacao;
use App\Models\User;
use Illuminate\Support\Facades\Mail;

// Só as migrations de que estes testes precisam: várias das antigas usam SQL
// exclusivo do Postgres e não rodam no SQLite em memória do phpunit.xml.
beforeEach(function () {
    $this->artisan('migrate:fresh', [
        '--path' => [
            'database/migrations/0001_01_01_000000_create_users_table.php',
            'database/migrations/2025_08_14_170933_add_two_factor_columns_to_users_table.php',
            'database/migrations/2026_05_05_230000_create_segurados_table.php',
            'database/migrations/2026_08_25_140139_add_deleted_at_to_segurados_table.php',
            'database/migrations/2026_08_28_040254_add_bairro_to_segurados_table.php',
            'database/migrations/2026_08_28_040933_fix_coluna_bairro_segurados_table.php',
            'database/migrations/2026_09_03_020000_add_razao_social_to_segurados_table.php',
            'database/migrations/2026_05_12_004653_create_notificacoes_table.php',
            'database/migrations/2026_08_21_005753_tipos_notificacao.php',
            'database/migrations/2026_08_21_011214_add_tipo_notificacao_id_to_notificacoes_table.php',
            'database/migrations/2026_09_23_211923_add_erro_to_notificacoes_table.php',
            'database/migrations/2026_10_27_120000_create_auditorias_table.php',
        ],
    ]);

    $this->admin = User::factory()->create(['role' => 'admin']);
    $this->tipo = TipoNotificacao::create(['nome_notificacao' => 'Lembrete', 'ativo' => true]);
    $this->segurado = Segurado::create([
        'nome_completo' => 'Maria Teste',
        'tipo_pessoa' => 'pf',
        'cpf_cnpj' => '52998224725',
        'data_nascimento_fundacao' => '1990-01-01',
        'email' => 'maria@teste.com',
        'celular_whatsapp' => '11999999999',
        'endereco' => 'Rua A',
        'cidade' => 'São Paulo',
        'estado' => 'SP',
        'cep' => '01000000',
    ]);
});

function enviar($teste, string $canal = 'email')
{
    return $teste->actingAs($teste->admin)->post('/notificacoes', [
        'segurado_ids' => [$teste->segurado->id],
        'canal' => $canal,
        'mensagem' => 'Sua parcela vence amanhã.',
        'tipo_notificacao_id' => $teste->tipo->id,
    ]);
}

test('e-mail enviado fica Enviado e o toast é de sucesso', function () {
    Mail::fake();

    enviar($this)->assertSessionHas('success', 'Notificação enviada com sucesso.');

    Mail::assertSent(NotificacaoMail::class, fn ($mail) => $mail->hasTo('maria@teste.com'));
    expect(Notificacoes::first()->status)->toBe('Enviado');
});

test('falha do mailer vira Falha com motivo legível, sem erro 500', function () {
    // Simula o erro real encontrado: o pacote do Resend ausente lança \Error,
    // que o catch (\Exception) antigo não pegava.
    Mail::shouldReceive('to')->andThrow(new Error('Class "Resend" not found'));

    enviar($this)
        ->assertRedirect()
        ->assertSessionHas('error', fn ($msg) => str_contains($msg, 'composer install'));

    $notificacao = Notificacoes::first();
    expect($notificacao->status)->toBe('Falha')
        ->and($notificacao->erro)->toContain('pacote do Resend');
});

test('restrição do remetente de teste do Resend vira orientação clara', function () {
    Mail::shouldReceive('to')->andThrow(new RuntimeException(
        'Request to Resend API failed. Reason: You can only send testing emails to your own email address.'
    ));

    enviar($this)->assertSessionHas('error', fn ($msg) => str_contains($msg, 'Verifique um domínio'));

    expect(Notificacoes::first()->erro)->toContain('MAIL_FROM_ADDRESS');
});

test('WhatsApp não dispara e-mail e fica Enviado', function () {
    Mail::fake();

    enviar($this, 'whatsapp')->assertSessionHas('success');

    Mail::assertNothingSent();
    expect(Notificacoes::first()->status)->toBe('Enviado');
});
