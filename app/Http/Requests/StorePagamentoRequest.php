<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class StorePagamentoRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'segurado_id'      => 'required|integer|exists:segurados,id',
            'apolice_id'       => 'required|integer|exists:apolices,id',
            'parcela'          => 'required|integer|min:1',
            'valor'            => 'required|numeric|min:0.01',
            'data_pagamento'   => 'required|date',
            'forma_pagamento'  => 'required|string|in:boleto,pix,cartão,débito',
            'status'           => 'required|string|in:confirmado,pendente',
            'observacoes'      => 'nullable|string',
        ];
    }

    public function messages(): array
    {
        return [
            'segurado_id.required' => 'O campo segurado é obrigatório.',
            'segurado_id.exists' => 'O segurado selecionado não existe.',
            'apolice_id.required' => 'O campo apólice é obrigatório.',
            'apolice_id.exists' => 'A apólice selecionada não existe.',
            'parcela.required' => 'O campo parcela é obrigatório.',
            'valor.required' => 'O campo valor é obrigatório.',
            'data_pagamento.required' => 'O campo data de pagamento é obrigatório.',
            'data_pagamento.date' => 'O campo data de pagamento deve ser uma data válida.',
            'forma_pagamento.required' => 'O campo forma de pagamento é obrigatório.',
            'forma_pagamento.in' => 'A forma de pagamento selecionada é inválida. Escolha entre boleto, pix, cartão ou débito.',
            'status.required' => 'O campo status é obrigatório.',
        ];
    }
}