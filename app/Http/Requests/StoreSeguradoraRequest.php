<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class StoreSeguradoraRequest extends FormRequest
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
            'nome_fantasia' => 'required|string|max:255',
            'razao_social'  => 'nullable|string|max:255',
            'cnpj'          => 'required|string|max:20|unique:seguradoras,cnpj',
            'contato_nome'  => 'nullable|string|max:255',
            'email_suporte' => 'nullable|email|max:255',
            'ramos'         => 'nullable|array',      // aceita array
            'ramos.*'       => 'string|max:100',      // cada item do array é uma string
        ];
    }
}
