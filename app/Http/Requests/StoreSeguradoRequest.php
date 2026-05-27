<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class StoreSeguradoRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
                //Validação dos dados recebidos do form segurados
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
        ];
    }
}
