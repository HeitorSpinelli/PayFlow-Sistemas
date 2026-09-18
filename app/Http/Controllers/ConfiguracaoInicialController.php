<?php

namespace App\Http\Controllers;

use App\Concerns\PasswordValidationRules;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class ConfiguracaoInicialController extends Controller
{
    use PasswordValidationRules;

    // Substitui o /register público (desativado depois do bug crítico de
    // registro aberto — ver config/fortify.php) pro cenário de venda: o
    // cliente recebe um banco vazio e só tem acesso à URL da aplicação, sem
    // console do servidor pra rodar `php artisan usuarios:criar-admin`.
    public function create(): Response
    {
        $this->abortSeJaExisteUsuario();

        return Inertia::render('auth/configuracao-inicial');
    }

    public function store(Request $request)
    {
        // Checa antes de validar: com o cadastro fechado (já existe
        // usuário), este endpoint tem que se comportar exatamente como o
        // GET — 404 seco — em vez de rodar a validação primeiro e vazar
        // informação (regra de senha, ou se um e-mail já está em uso) por
        // uma rota que nem deveria "existir" mais.
        $this->abortSeJaExisteUsuario();

        $data = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255|unique:users,email',
            'password' => $this->passwordRules(),
        ]);

        $user = DB::transaction(function () use ($data) {
            // Checagem repetida de propósito: a checagem acima só fecha a
            // rota se, no momento em que a requisição chegou, já existia
            // usuário — não impede que outra pessoa crie um usuário bem
            // no intervalo entre essa checagem e este ponto. Esta segunda
            // checagem, já dentro da transação, é a que realmente evita
            // dois "primeiros admins" concorrentes.
            $this->abortSeJaExisteUsuario();

            $user = User::create([
                'name' => $data['name'],
                'email' => $data['email'],
                'password' => $data['password'],
                'role' => 'admin',
            ]);

            // email_verified_at não está no $fillable do model — atribuição
            // direta ignora essa proteção de propósito, mesmo padrão do
            // UserController::store() (quem preenche esta tela está, pela
            // própria natureza dela, confirmando a própria identidade).
            $user->email_verified_at = now();
            $user->save();

            return $user;
        });

        // Loga direto: não faz sentido pedir pra digitar a senha de novo
        // logo em seguida de ter acabado de digitá-la aqui.
        Auth::login($user);

        return redirect()->route('dashboard');
    }

    private function abortSeJaExisteUsuario(): void
    {
        if (User::count() > 0) {
            abort(404);
        }
    }
}
