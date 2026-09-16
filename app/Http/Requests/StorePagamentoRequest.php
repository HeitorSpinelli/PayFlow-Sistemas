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
                    ->where('apolice_id', $this->apolice_id)
                    ->withoutTrashed(),
            ],
            // Teto contra erro de digitação no modo manual (um zero a mais
            // vira um pagamento de milhões) e contra estourar a coluna
            // decimal(15,2) do Postgres, que gera erro de banco, não de
            // validação — o usuário veria "erro interno" em vez do campo.
            'valor' => 'required|numeric|min:0.01|max:99999999.99',
            // Só vale quando o operador marca "ajustar valor manualmente";
            // sem isso, o backend usa o valor que ele mesmo calcula.
            'valor_manual' => 'sometimes|boolean',
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
            'valor.max' => 'O valor informado é alto demais. Confira se não sobrou um dígito a mais.',
            'data_pagamento.required' => 'O campo data de pagamento é obrigatório.',
            'data_pagamento.date' => 'O campo data de pagamento deve ser uma data válida.',
            'data_pagamento.before_or_equal' => 'A data de pagamento não pode ser uma data futura.',
            'forma_pagamento.required' => 'O campo forma de pagamento é obrigatório.',
            'forma_pagamento.in' => 'A forma de pagamento selecionada é inválida. Escolha entre boleto, pix, cartão ou débito.',
            'status.required' => 'O campo status é obrigatório.',
        ];
    }
}
