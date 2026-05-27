<?php

namespace App\Http\Controllers;

use App\Models\apolices;
use App\Models\Segurado;
use App\Models\seguradora;
use App\Models\ramo;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreApoliceRequest;
use App\Models\ramos;
use ErrorException;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ApolicesController extends Controller
{
    public function store (StoreApoliceRequest $request){

        $data = $request->validated();

    }

    public function buscar(){
        //Fazendo um select usando o model segurado nos campos abaixo e indo no banco fazer a requisição
        $segurado = Segurado::select('id', 'nome_completo', 'cpf_cnpj')-> get();

        //Retorna a tela com os clientes que encontrou
        return inertia('FunctionsApp/apolices', [
            'clientes' => $segurado,
        ]);
    }
}