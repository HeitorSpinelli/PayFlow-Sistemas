<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class StoreNotificacaoRequest extends FormRequest
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
            'segurado_ids'     => 'required|array|min:1',
            'segurado_ids.*'   => 'exists:segurados,id',
            'canal'            => 'required|string|in:email,whatsapp',
            'mensagem'         => 'required|string',
            'tipo_notificacao_id' => 'required|integer|exists:tipos_notificacao,id'
        ];
    }
}
