<?php

namespace App\Providers;

use App\Actions\Fortify\CreateNewUser;
use App\Actions\Fortify\ResetUserPassword;
use App\Http\Responses\LinkRedefinicaoSemEnumeracao;
use App\Models\User;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Laravel\Fortify\Contracts\FailedPasswordResetLinkRequestResponse;
use Laravel\Fortify\Features;
use Laravel\Fortify\Fortify;

class FortifyServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        // "Esqueci a senha" não revela se o e-mail tem conta (ver a classe).
        $this->app->bind(FailedPasswordResetLinkRequestResponse::class, LinkRedefinicaoSemEnumeracao::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->configureActions();
        $this->configureViews();
        $this->configureRateLimiting();
    }

    /**
     * Configure Fortify actions.
     */
    private function configureActions(): void
    {
        Fortify::resetUserPasswordsUsing(ResetUserPassword::class);
        Fortify::createUsersUsing(CreateNewUser::class);
    }

    /**
     * Configure Fortify views.
     */
    private function configureViews(): void
    {
        // Sem usuário nenhum no banco não tem como logar em lugar nenhum —
        // manda direto pra Configuração Inicial em vez de mostrar um
        // formulário de login que ninguém consegue de fato preencher.
        // Cobre também quem cai aqui via redirecionamento automático do
        // middleware `auth` (ex.: tentou abrir /dashboard sem estar logado).
        Fortify::loginView(fn (Request $request) => User::query()->exists()
            ? Inertia::render('auth/login', [
                'canResetPassword' => Features::enabled(Features::resetPasswords()),
                'status' => $request->session()->get('status'),
            ])
            : redirect()->route('configuracao-inicial'));

        Fortify::resetPasswordView(fn (Request $request) => Inertia::render('auth/reset-password', [
            'email' => $request->email,
            'token' => $request->route('token'),
        ]));

        Fortify::requestPasswordResetLinkView(fn (Request $request) => Inertia::render('auth/forgot-password', [
            'status' => $request->session()->get('status'),
        ]));

        Fortify::verifyEmailView(fn (Request $request) => Inertia::render('auth/verify-email', [
            'status' => $request->session()->get('status'),
        ]));

        Fortify::registerView(fn () => Inertia::render('auth/register'));

        Fortify::twoFactorChallengeView(fn () => Inertia::render('auth/two-factor-challenge'));

        Fortify::confirmPasswordView(fn () => Inertia::render('auth/confirm-password'));
    }

    /**
     * Configure rate limiting.
     */
    private function configureRateLimiting(): void
    {
        RateLimiter::for('two-factor', function (Request $request) {
            return Limit::perMinute(5)->by($request->session()->get('login.id'));
        });

        // Três travas somadas: 5/min por e-mail+IP (adivinhar a senha de uma
        // conta), 10/min por e-mail vindo de qualquer IP (ataque distribuído
        // contra uma conta) e 30/min por IP em qualquer e-mail (testar uma
        // senha comum em muitas contas — "password spraying").
        RateLimiter::for('login', function (Request $request) {
            $email = Str::transliterate(Str::lower((string) $request->input(Fortify::username())));

            return [
                Limit::perMinute(5)->by($email.'|'.$request->ip()),
                Limit::perMinute(10)->by('email:'.$email),
                Limit::perMinute(30)->by('ip:'.$request->ip()),
            ];
        });

        // Teto geral por IP para todas as rotas do Fortify (login, esqueci a
        // senha, redefinir senha, desafio 2FA...). "Esqueci a senha" não tinha
        // limite nenhum: dava para disparar e-mails de redefinição em massa.
        RateLimiter::for('autenticacao', function (Request $request) {
            return Limit::perMinute(60)->by($request->ip());
        });
    }
}
