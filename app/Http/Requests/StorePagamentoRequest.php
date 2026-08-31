<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

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
            'apolice_id' => 'required|integer|exists:apolices,id',
            'parcela' => [
                'required',
                'integer',
                'min:1',
                Rule::unique('pagamentos', 'parcela')
                    ->where('apolice_id', $this->apolice_id),
            ],
            'valor' => 'required|numeric|min:0.01',
            'data_pagamento' => 'required|date|before_or_equal:today',
            'forma_pagamento' => 'required|string|in:boleto,pix,cartão,débito',
            'status' => 'required|string|in:confirmado',
            'observacoes' => 'nullable|string',
        ];
    }

    public function messages(): array
    {
        return [
            'apolice_id.required' => 'O campo apólice é obrigatório.',
            'apolice_id.exists' => 'A apólice selecionada não existe.',
            'parcela.required' => 'O campo parcela é obrigatório.',
            'parcela.unique' => 'Essa parcela já foi registrada para esta apólice.',
            'valor.required' => 'O campo valor é obrigatório.',
            'data_pagamento.required' => 'O campo data de pagamento é obrigatório.',
            'data_pagamento.date' => 'O campo data de pagamento deve ser uma data válida.',
            'data_pagamento.before_or_equal' => 'A data de pagamento não pode ser uma data futura.',
            'forma_pagamento.required' => 'O campo forma de pagamento é obrigatório.',
            'forma_pagamento.in' => 'A forma de pagamento selecionada é inválida. Escolha entre boleto, pix, cartão ou débito.',
            'status.required' => 'O campo status é obrigatório.',
        ];
    }
}
