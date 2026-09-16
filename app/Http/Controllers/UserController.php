<?php

namespace App\Http\Controllers;

use App\Concerns\PasswordValidationRules;
use App\Models\User;
use App\Services\Apolice\ApoliceService;
use App\Services\Cliente\SeguradoService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class UserController extends Controller
{
    use PasswordValidationRules;

    protected SeguradoService $segurado_service;

    protected ApoliceService $apolice_service;

    public function __construct(SeguradoService $segurado_service, ApoliceService $apolice_service)
    {
        $this->segurado_service = $segurado_service;
        $this->apolice_service = $apolice_service;
    }

    // Único jeito de criar usuário agora que o cadastro público em /register
    // foi desativado (ver config/fortify.php) — só um admin já autenticado
    // pode dar acesso a alguém. Marca email_verified_at na hora porque o
    // admin já está confirmando a identidade da pessoa ao cadastrá-la; não
    // depende do envio de e-mail de verificação (Resend está em modo
    // sandbox e hoje não entrega pra outros endereços).
    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255|unique:users,email',
            'password' => $this->passwordRules(),
            'role' => 'required|string|in:admin,user',
        ]);

        $user = User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => $data['password'],
            'role' => $data['role'],
        ]);

        // email_verified_at não está no $fillable do model (só name, email,
        // password, role) — atribuição direta ignora essa proteção, que aqui
        // é o comportamento certo, já que o admin está confirmando a
        // identidade da pessoa neste exato momento.
        $user->email_verified_at = now();
        $user->save();

        return redirect()->back()->with('success', 'Usuário cadastrado com sucesso!');
    }

    public function index()
    {
        $users = User::all();
        $inativos = $this->segurado_service->listarInativos();

        return Inertia::render('FunctionsApp/administracao', [
            'users' => $users,
            'inativos' => $inativos,
            'apolicesCanceladas' => $this->apolice_service->listarCanceladas(),
            'apolicesVencidas' => $this->apolice_service->listarVencidas(),
            'apolicesSuspensas' => $this->apolice_service->listarSuspensas(),
        ]);
    }

    public function update(Request $request, int $id)
    {
        $user = User::findOrFail($id);

        $request->validate([
            'role' => 'required|string|in:admin,user',
        ]);

        // Total de admins
        $totalAdmins = User::where('role', 'admin')->count();

        // VaiDeixarDeSerAdmin é uma variável booleana onde caso cargo
        // do usuario seja identico a admin e onde a alteração do request alterar
        // o cargo para algo diferente de admin
        $vaiDeixarDeSerAdmin = $user->role === 'admin' && $request->role !== 'admin';
        $eOUltimoAdmin = $totalAdmins === 1;

        // Se ambas as condições forem verdadeiras (a pessoa vai deixar de ser admin
        // E é o último admin restante), a alteração é bloqueada.
        // Se qualquer uma das duas for falsa, a alteração é permitida normalmente.
        if ($vaiDeixarDeSerAdmin && $eOUltimoAdmin) {
            return redirect()->back()->with('error', 'Não é possível remover o último administrador do sistema.');
        }

        $user->update([
            'role' => $request->role,
        ]);

        return redirect()->back()->with('success', 'Cargo atualizado com sucesso!');
    }
}
