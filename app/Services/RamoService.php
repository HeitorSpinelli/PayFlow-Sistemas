<?php

namespace App\Services;

use App\Models\Ramo;

class RamoService
{
    public function show(int $id)
    {
        return Ramo::findOrFail($id);
    }
}