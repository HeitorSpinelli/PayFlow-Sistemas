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
            'valor_premio_total' => 'required|numeric',
            'valor_cobertura' => 'required|numeric',
            'quantidade_parcelas' => 'required|integer',
            'forma_pagamento' => 'required|string|max:50',
            'inicio_vigencia' => 'required|date',
            'fim_vigencia' => 'required|after:inicio_vigencia',
            'observacoes' => 'nullable|string'
        ];
    }

    /**
     * Get the error messages for the defined validation rules.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'numero_apolice.required' => 'O número da apólice é obrigatório.',
            'numero_apolice.unique' => 'Este número de apólice já está cadastrado.',
            'cliente_id.required' => 'O campo cliente é obrigatório.',
            'cliente_id.exists' => 'O cliente selecionado é inválido.',
            'seguradora_id.required' => 'O campo seguradora é obrigatório.',
            'seguradora_id.exists' => 'A seguradora selecionada é inválida.',
            'ramo_id.required' => 'O campo ramo é obrigatório.',
            'ramo_id.exists' => 'O ramo selecionado é inválido.',
            'valor_premio_total.required' => 'O valor do prêmio total é obrigatório.',
            'valor_premio_total.numeric' => 'O valor do prêmio total deve ser um número.',
            'valor_cobertura.required' => 'O valor da cobertura é obrigatório.',
            'valor_cobertura.numeric' => 'O valor da cobertura deve ser um número.',
            'quantidade_parcelas.required' => 'A quantidade de parcelas é obrigatória.',
            'quantidade_parcelas.integer' => 'A quantidade de parcelas deve ser um número inteiro.',
            'forma_pagamento.required' => 'A forma de pagamento é obrigatória.',
            'inicio_vigencia.required' => 'A data de início da vigência é obrigatória.',
            'inicio_vigencia.date' => 'Informe uma data de início válida.',
            'fim_vigencia.required' => 'A data de término da vigência é obrigatória.',
            'fim_vigencia.after' => 'A data de término deve ser posterior à data de início.',
        ];
    }
}