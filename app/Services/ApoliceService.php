<?php

namespace App\Services;

use App\Models\Seguradora;
use App\Models\Segurado;
use App\Models\Ramos;
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

    //Função para buscar os segurados cadastrados no banco, selecionando apenas os campos id, nome_completo e cpf_cnpj
    public function buscar(){
        try{
            return Segurado::select('id', 'nome_completo', 'cpf_cnpj')-> get();
        }catch(\Exception $e){
            throw new \Exception('Erro ao buscar segurados: ' . $e->getMessage());
        }
    }

    public function buscarSeguradoras(){
        try{
            return Seguradora::select('id', 'nome_fantasia')-> get();
        }catch(\Exception $e){
            throw new \Exception('Erro ao buscar seguradoras: ' . $e->getMessage());
        }
    }

    public function buscarRamos(){
        try{
            return Ramos::select('id', 'nome_ramo')-> get();
        }catch(\Exception $e){
            throw new \Exception('Erro ao buscar ramos: ' . $e->getMessage());
        }
    }

    public function buscarApolices(){
        try{
            return Apolices::all();
        }catch(\Exception $e){
            throw new \Exception('Erro ao buscar apólices: ' . $e->getMessage());
        }
    }

    //Função para contar o total de apolices cadastradas no banco
    public function count(){
        try{
            return Apolices::count();
        }catch(\Exception $e){
            throw new \Exception('Erro ao contar apólices: ' . $e->getMessage());
        }
    }
}