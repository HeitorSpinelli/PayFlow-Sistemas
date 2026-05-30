<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreSeguradoraRequest;
use App\Models\Seguradora;
use App\Services\SeguradorasService;
use Illuminate\Http\Request;

class seguradorasController extends Controller
{

    protected SeguradorasService $seguradorasService;

    public function __construct(SeguradorasService $seguradorasService){
        $this->seguradorasService = $seguradorasService;
    }

    public function show(){
        $seguradoras = $this->seguradorasService->show();
        return inertia('FunctionsApp/apolices', [
            'seguradoras' => $seguradoras,
        ]);
    }
}
