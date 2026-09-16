<?php

namespace App\Console\Commands;

use App\Concerns\PasswordValidationRules;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Validator;

class CriarAdminCommand extends Command
{
    use PasswordValidationRules;

    protected $signature = 'usuarios:criar-admin';

    // Só roda pelo console do servidor, nunca por uma rota HTTP — é o jeito
    // de recuperar acesso depois de um banco novo/limpo (migrate:fresh),
    // já que o cadastro público em /register foi desativado de propósito.
    protected $description = 'Cria (ou promove a admin) um usuário — usar quando não existe nenhuma conta ainda.';

    public function handle(): int
    {
        $name = $this->ask('Nome completo');
        $email = $this->ask('E-mail');
        $password = $this->secret('Senha');
        $passwordConfirmation = $this->secret('Confirme a senha');

        $validador = Validator::make(
            [
                'name' => $name,
                'email' => $email,
                'password' => $password,
                'password_confirmation' => $passwordConfirmation,
            ],
            [
                'name' => 'required|string|max:255',
                'email' => 'required|email|max:255',
                'password' => $this->passwordRules(),
            ],
        );

        if ($validador->fails()) {
            foreach ($validador->errors()->all() as $erro) {
                $this->error($erro);
            }

            return self::FAILURE;
        }

        $existente = User::where('email', $email)->first();

        if ($existente) {
            $existente->role = 'admin';
            $existente->save();
            $this->info("Usuário {$email} já existia — promovido a admin.");

            return self::SUCCESS;
        }

        $user = User::create([
            'name' => $name,
            'email' => $email,
            'password' => $password,
            'role' => 'admin',
        ]);

        // Quem tem acesso ao console do servidor pra rodar este comando já
        // é o operador confiável do sistema — não faz sentido exigir
        // verificação de e-mail aqui.
        $user->email_verified_at = now();
        $user->save();

        $this->info("Admin '{$name}' <{$email}> criado com sucesso.");

        return self::SUCCESS;
    }
}
