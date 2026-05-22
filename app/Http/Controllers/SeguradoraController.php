<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreSeguradoraRequest;
use Illuminate\Http\Request;

class seguradorasController extends Controller
{

    public function store(StoreSeguradoraRequest $request)
    {
        $data = $request->validated();
    }
}
