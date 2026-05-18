<?php

namespace App\Http\Controllers;

use App\Models\apolices;
use App\Models\Segurado;
use App\Models\seguradora;
use App\Models\ramo;
use App\Http\Controllers\Controller;
use App\Models\ramos;
use ErrorException;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ApolicesController extends Controller
{
    public function store (Request $request){

        //Validação dos dados inseridos no form de Apolices
        $data = $request->validate([
            'numero_apolice' => 'required|string|max:100|unique:apolices',
            'cliente_id' => 'required|exists:segurados,id',
            'seguradora_id' => 'required|exists:seguradoras,id',
            'ramo_id' => 'required|exists:ramos,id',
            'valor_premio_total' => 'required|numeric',
            'valor_cobertura' => 'required|numeric',
            'quantidade_parcelas' => 'required|integer',
            'forma_pagamento' => 'required|string|max:50',
            'inicio_vigencia' => 'required|date',
            'fim_vigencia' => 'required|after:inicio_vigencia',
            'observacoes' => 'nullable|string'
        ]);

        try{
            apolices::create($data);

            return redirect()->back()->with('success', 'Apolice cadastrada com sucesso!');
        }catch(\Exception $e){

            return redirect()->back()->with('error', 'Não foi possivel cadasrar a Apolice!');

        }
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