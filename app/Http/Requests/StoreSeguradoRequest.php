<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Validation\Rule;
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
            //Smart Registration para validar CPF ou CNPJ dependendo do tipo de pessoa e reativar um cliente caso tenha sido excluído anteriormente
            'cpf_cnpj'                 => [
                'required', 
                'string', 
                'max:20', 
                //mantem a regra de cpf ser unico menos os registros dos que foram deletados
                Rule::unique('segurados', 'cpf_cnpj')->withoutTrashed(),
            ],
            'data_nascimento_fundacao' => 'required|date|before_or_equal:today',
            'email'                    => 'required|email|max:255',
            'telefone_fixo'            => 'nullable|string|max:20',
            'celular_whatsapp'         => 'required|string|max:20',
            'endereco'                 => 'required|string',
            'cidade'                   => 'required|string|max:100',
            'estado'                   => 'required|string|size:2',
            'cep'                      => 'required|string|max:15',
            'observacoes'              => 'nullable|string',
        ];
    }
    public function messages(): array
    {
        return [
            'nome_completo.required' => 'O campo nome completo é obrigatório.',
            'tipo_pessoa.required' => 'O campo tipo de pessoa é obrigatório.',
            'tipo_pessoa.in' => 'O campo tipo de pessoa deve ser "pf" ou "pj".',
            'cpf_cnpj.required' => 'O campo CPF/CNPJ é obrigatório.',
            'cpf_cnpj.unique' => 'O CPF/CNPJ já está cadastrado.',
            'data_nascimento_fundacao.required' => 'O campo data de nascimento/fundação é obrigatório.',
            'data_nascimento_fundacao.before_or_equal' => 'A data não pode ser superior à data atual.',
            'data_nascimento_fundacao.date' => 'O campo data de nascimento/fundação deve ser uma data válida.',
            'email.required' => 'O campo e-mail é obrigatório.',
            'email.email' => 'O campo e-mail deve ser um endereço de e-mail válido.',
            'telefone_fixo.string' => 'O campo telefone fixo deve ser uma string.',
            'celular_whatsapp.required' => 'O campo celular/WhatsApp é obrigatório.',
            'endereco.required' => 'O campo endereço é obrigatório.',
            'cidade.required' => 'O campo cidade é obrigatório.',
            'estado.required' => 'O campo estado é obrigatório.',
            'estado.size' => 'O campo estado deve ter exatamente 2 caracteres.',
            'cep.required' => 'O campo CEP é obrigatório.',
        ];
    }
}
