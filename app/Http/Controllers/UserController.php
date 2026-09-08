<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Services\Cliente\SeguradoService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class UserController extends Controller
{

    protected SeguradoService $segurado_service;

    public function __construct(SeguradoService $segurado_service)
    {
        $this->segurado_service = $segurado_service;
    }

    public function index()
    {
        $users = User::all();
        $inativos = $this->segurado_service->listarInativos();

        return Inertia::render('FunctionsApp/administracao', [
            'users' => $users,
            'inativos' => $inativos
        ]);
    }

    public function update(Request $request, int $id)
    {
        $user = User::findOrFail($id);

        $request->validate([
            'role' => 'required|string|in:admin,user'
        ]);

        //Total de admins
        $totalAdmins = User::where('role', 'admin')->count();

        //VaiDeixarDeSerAdmin é uma variável booleana onde caso cargo 
        // do usuario seja identico a admin e onde a alteração do request alterar
        //o cargo para algo diferente de admin 
        $vaiDeixarDeSerAdmin = $user->role === 'admin' && $request->role !== 'admin';
        $eOUltimoAdmin = $totalAdmins === 1;

        // Se ambas as condições forem verdadeiras (a pessoa vai deixar de ser admin
        // E é o último admin restante), a alteração é bloqueada.
        // Se qualquer uma das duas for falsa, a alteração é permitida normalmente.
        if ($vaiDeixarDeSerAdmin && $eOUltimoAdmin) {
            return redirect()->back()->with('error', 'Não é possível remover o último administrador do sistema.');
        }

        $user->update([
            'role' => $request->role
        ]);

        return redirect()->back()->with('success', 'Cargo atualizado com sucesso!');
    }
}
