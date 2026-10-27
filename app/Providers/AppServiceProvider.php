<?php

namespace App\Providers;

use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;

/**
 * Configuração global da aplicação: Gate 'is-admin', padrões de produção
 * (senha forte, datas imutáveis) e limites de requisições.
 */
class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     *
     * Define o Gate 'is-admin' — usado nas rotas com can:is-admin (telas
     * Seguradoras, Notificações, Administração e ações sensíveis de apólice e
     * pagamento). Quem não é admin recebe 403.
     */
    public function boot(): void
    {
        Gate::define('is-admin', function (User $user) {
            return $user->role === 'admin';
        });

        $this->configureDefaults();
        $this->configureRateLimiting();
    }

    /**
     * Configure default behaviors for production-ready applications.
     *
     * Em produção, exige senha forte (mín. 12, maiúsc./minúsc., número, símbolo,
     * não vazada) — afeta a tela Configuração Inicial e o modal "Novo Usuário".
     */
    protected function configureDefaults(): void
    {
        Date::use(CarbonImmutable::class);

        DB::prohibitDestructiveCommands(
            app()->isProduction(),
        );

        Password::defaults(
            fn (): ?Password => app()->isProduction()
                ? Password::min(12)
                    ->mixedCase()
                    ->letters()
                    ->numbers()
                    ->symbols()
                    ->uncompromised()
                : null,
        );
    }

    /**
     * Rate limiters para as rotas autenticadas do app (fora dos limiters de
     * login/2FA, que já ficam no FortifyServiceProvider). Sem isso, uma
     * sessão comprometida (ou um script rodando com o cookie roubado) podia
     * martelar clientes/apólices/pagamentos sem nenhum limite.
     */
    protected function configureRateLimiting(): void
    {
        RateLimiter::for('web-actions', function (Request $request) {
            return Limit::perMinute(200)->by($request->user()?->id ?: $request->ip());
        });

        // Importação processa upload + parsing de arquivo em lote — mais
        // custoso por requisição, então o limite é bem mais apertado.
        RateLimiter::for('importacao', function (Request $request) {
            return Limit::perMinute(10)->by($request->user()?->id ?: $request->ip());
        });
    }
}
