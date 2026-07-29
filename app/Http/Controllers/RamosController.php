<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreRamoRequest;
use App\Http\Controllers\Controller;
use App\Services\RamoService;

class RamosController extends Controller
{
    private $ramoService;

    public function __construct(RamoService $ramoService)
    {
        $this->ramoService = $ramoService;
    }

    //ramo de cada contrato de seguro, como automóvel, residencial, vida, saúde, etc.
    public function storeRamo(StoreRamoRequest $request)
    {
        $data = $request->validated();
        $this->ramoService->store($data);
    }

    public function showRamo(int $id)
    {
        return $this->ramoService->show($id);
    }
}
