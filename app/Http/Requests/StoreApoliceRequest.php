<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class StoreApoliceRequest extends FormRequest
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
            'numero_apolice' => 'required|string|max:100|unique:apolices',
            'cliente_id' => 'required|exists:segurados,id',
            'seguradora_id' => 'required|exists:seguradoras,id',
            'ramo_id' => 'required|exists:ramos,id',
            'valor_premio_total' => 'required|numeric|min:0',
            'valor_cobertura' => 'required|numeric|min:0',
            'quantidade_parcelas' => 'required|integer|min:1|max:12',
            'forma_pagamento' => 'required|string|max:50',
            'inicio_vigencia' => 'required|date',
            'fim_vigencia' => 'required|date|after:inicio_vigencia',
            'status' => 'required|string|in:Ativa,Inativa',
            'observacoes' => 'nullable|string'
        ];
    }

    /**
     * Get the custom validation messages.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            // Apólice
            'numero_apolice.required' => 'O número da apólice é obrigatório.',
            'numero_apolice.string' => 'O número da apólice deve ser um texto válido.',
            'numero_apolice.max' => 'O número da apólice não pode ter mais de 100 caracteres.',
            'numero_apolice.unique' => 'Este número de apólice já está cadastrado no sistema.',

            // Cliente
            'cliente_id.required' => 'O cliente é obrigatório.',
            'cliente_id.exists' => 'O cliente selecionado é inválido ou não foi encontrado.',

            // Seguradora
            'seguradora_id.required' => 'A seguradora é obrigatória.',
            'seguradora_id.exists' => 'A seguradora selecionada é inválida.',

            // Ramo
            'ramo_id.required' => 'O ramo é obrigatório.',
            'ramo_id.exists' => 'O ramo selecionado é inválido.',

            // Valores e Pagamento
            'valor_premio_total.required' => 'O valor do prêmio total é obrigatório.',
            'valor_premio_total.numeric' => 'O valor do prêmio deve ser um número válido.',
            'valor_premio_total.min' => 'O valor do prêmio não pode ser negativo.',

            'valor_cobertura.required' => 'O valor da cobertura é obrigatório.',
            'valor_cobertura.numeric' => 'O valor da cobertura deve ser um número válido.',
            'valor_cobertura.min' => 'O valor da cobertura não pode ser negativo.',

            'quantidade_parcelas.required' => 'A quantidade de parcelas é obrigatória.',
            'quantidade_parcelas.integer' => 'A quantidade de parcelas deve ser um número inteiro.',
            'quantidade_parcelas.min' => 'A quantidade de parcelas deve ser de pelo menos 1.',

            'forma_pagamento.required' => 'A forma de pagamento é obrigatória.',
            'forma_pagamento.string' => 'A forma de pagamento informada é inválida.',
            'forma_pagamento.max' => 'A forma de pagamento excede o limite de caracteres.',

            // Vigência
            'inicio_vigencia.required' => 'A data de início da vigência é obrigatória.',
            'inicio_vigencia.date' => 'Informe uma data de início válida.',

            'fim_vigencia.required' => 'A data de fim da vigência é obrigatória.',
            'fim_vigencia.date' => 'Informe uma data de término válida.',
            'fim_vigencia.after' => 'A data de fim da vigência deve ser posterior à data de início.',

            // Status
            'status.required' => 'O status da apólice é obrigatório.',
            'status.in' => 'O status selecionado deve ser Ativa ou Inativa.',

            // Observações
            'observacoes.string' => 'As observações devem estar em formato de texto.'
        ];
    }
}
