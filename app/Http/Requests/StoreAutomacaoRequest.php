<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

/**
 * Validação do formulário de automação do modal de configurações da tela
 * Notificações.
 */
class StoreAutomacaoRequest extends FormRequest
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
            'tipo_condicao' => 'required|string|in:apolice_vencendo,parcela_vencendo,parcela_em_atraso,cliente_inativo',
            'dias' => 'required|integer|min:1',
            'intervalo_dias' => 'nullable|integer|min:1|lte:dias',
            'tipo_notificacao_id' => 'required|integer|exists:tipos_notificacao,id',
            'mensagem' => 'required|string',
            'canal' => 'required|string|in:email,whatsapp',
            'ativo' => 'nullable|boolean',
        ];
    }
}
