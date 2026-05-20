<?php

namespace App\Http\Controllers;

use App\Models\Segurado;
use Illuminate\Http\Request;

class SeguradoController extends Controller
{
    public function store(Request $request)
    {
        //1° Validaçao dos dados recebidos do create-segurado-modal.tsx
        $data = $request->validate([
            'nome_completo'            => 'required|string|max:255',
            'tipo_pessoa'              => 'required|in:pf,pj',
            'cpf_cnpj'                 => 'required|string|max:20|unique:segurados,cpf_cnpj',
            'data_nascimento_fundacao' => 'required|date',
            'email'                    => 'required|email|max:255',
            'telefone_fixo'            => 'nullable|string|max:20',
            'celular_whatsapp'         => 'required|string|max:20',
            'endereco'                 => 'required|string',
            'cidade'                   => 'required|string|max:100',
            'estado'                   => 'required|string|size:2',
            'cep'                      => 'required|string|max:15',
            'status'                   => 'nullable|string|in:Ativo,Inativo,Pendente',
            'observacoes'              => 'nullable|string',
        ]);     
        
        try {
            //2° Criação dos dados recebidos do modal dentro do BD
            Segurado::create($data);

            //3° Retorna para o usuario que o Segurado foi cadastrado
            return redirect()->back()->with('success', 'Segurado cadastrado com sucesso!');

        } catch(\Exception $e){
            //Se tudo falhar 
            return redirect()->back()->with('error', 'Erro ao cadastrar segurado: ' . $e->getMessage());
        }
    }

    public function retorna()
    {
        $segurados = Segurado::all();
        
        return inertia('FunctionsApp/clientes', [
            'segurados' => $segurados,
        ]);
    }
}