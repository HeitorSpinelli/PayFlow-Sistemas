<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreParcelaRequest;
use Illuminate\Http\Request;

class ParcelasController extends Controller
{
    //Controlador para gerenciar as parcelas de cada contrato de seguro, incluindo o número da parcela, valor, data de vencimento, status de pagamento, etc.
    public function store(StoreParcelaRequest $request)
    {
        $data = $request->validated();
    }
}
