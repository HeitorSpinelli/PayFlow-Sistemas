<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Services\Cliente\SeguradoService;
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
}
