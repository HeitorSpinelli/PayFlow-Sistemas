<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class StoreParcelaRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return false;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'apolice_id' => 'required|exists:apolices,id',
            'numero_parcela' => 'required|integer|max:12',
            'valor_parcela' => 'required|numeric',
            'data_vencimento' => 'required|date',
            'status_pagamento' => 'required|string'
        ];
    }
}

