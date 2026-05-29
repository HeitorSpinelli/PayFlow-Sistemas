<?php

namespace App\Services;

use App\Models\Segurado;
use App\Models\Apolices;

class ApoliceService{
    
    public function store (array $data){

        //Tenta salvar a apolice. Se der erro ele pega a mensagem de erro e joga uma nova exceção com a mensagem personalizada
        try{
            Apolices::create($data);
        }catch(\Exception $e){
            throw new \Exception('Erro ao cadastrar apólice: ' . $e->getMessage());
        }
    }

    public function buscar(){
        try{
            return Segurado::select('id', 'nome_completo', 'cpf_cnpj')-> get();
        }catch(\Exception $e){
            throw new \Exception('Erro ao buscar segurados: ' . $e->getMessage());
        }
    }

    public function count(){
        try{
            return Apolices::count();
        }catch(\Exception $e){
            throw new \Exception('Erro ao contar apólices: ' . $e->getMessage());
        }
    }
}