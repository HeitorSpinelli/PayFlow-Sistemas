<?php

namespace App\Http\Requests;

use App\Rules\CnpjValido;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

/**
 * Validação da edição no modal de perfil da seguradora (tela Seguradoras).
 */
class UpdateSeguradoraRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     *
     * Sempre true: o acesso é controlado pelo middleware da rota (só admin).
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
            'razao_social' => 'nullable|string|max:255',
            'cnpj' => ['required', 'string', 'max:20', new CnpjValido, 'unique:seguradoras,cnpj,'.$this->route('id')],
            'contato_nome' => 'nullable|string|max:255',
            'email_suporte' => 'nullable|email|max:255',
        ];
    }
}
