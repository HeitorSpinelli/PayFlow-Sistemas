<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Validação de ramo novo adicionado no modal de perfil da seguradora.
 */
class StoreRamoRequest extends FormRequest
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
            'seguradora_id' => 'required|integer|exists:seguradoras,id',
            // Único POR SEGURADORA, não globalmente — sem o where(), nenhuma
            // outra seguradora poderia ter um ramo com o mesmo nome (ex: duas
            // seguradoras diferentes com um ramo "Vida" cada uma).
            'nome_ramo' => [
                'required',
                'string',
                'max:100',
                Rule::unique('ramos', 'nome_ramo')->where('seguradora_id', $this->seguradora_id),
            ],
            'categoria' => 'required|string|in:veiculo,residencial,vida,empresarial,outro',
        ];
    }

    /**
     * Mensagens em português exibidas no formulário de ramo.
     */
    public function messages(): array
    {
        return [
            'nome_ramo.unique' => 'Esta seguradora já tem um ramo com esse nome.',
        ];
    }
}
