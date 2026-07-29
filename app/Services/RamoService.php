<?php

namespace App\Services;

use App\Models\Ramo;

class RamoService
{
    public function show(int $id)
    {
        return Ramo::findOrFail($id);
    }

    public function store(array $data){
        return Ramo::create($data);
    }
}
