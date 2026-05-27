<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreRamoRequest;
use Illuminate\Http\Request;

class ramosController extends Controller
{
    //ramo de cada contrato de seguro, como automóvel, residencial, vida, saúde, etc.
    public function storeRamo(StoreRamoRequest $request)
    {
        $data = $request->validated();
    }
}
