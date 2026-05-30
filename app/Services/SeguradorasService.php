<?php

namespace App\Services;

use App\Models\Seguradora;
use App\Models\Apolices;

class SeguradorasService{

    public function show(){
        try{
            return Seguradora::select('id', 'nome')->get();
        }catch(\Exception $e){
            throw new \Exception('Erro ao encontrar seguradoras: ' . $e->getMessage());
        }
    }
}