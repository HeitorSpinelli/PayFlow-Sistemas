<?php

namespace App\Http\Requests;

use App\Rules\EmailSeguradoDisponivel;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class UpdateSeguradoRequest extends FormRequest
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
            'nome_completo' => 'required|string|max:255',
            'email' => ['required', 'email', new EmailSeguradoDisponivel((int) $this->route('id'))],
            'telefone_fixo' => 'nullable|string|max:20',
            'celular_whatsapp' => 'nullable|string|max:20',
            'endereco' => 'nullable|string|max:255',
            'cidade' => 'nullable|string|max:100',
            'bairro' => 'nullable|string|max:100',
            'estado' => 'nullable|string|size:2',
            'cep' => 'nullable|string|max:10',
            'observacoes' => 'nullable|string|max:255',
        ];
    }
}
