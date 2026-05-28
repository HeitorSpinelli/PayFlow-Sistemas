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
}
