<?php

namespace App\Http\Requests;

use App\Models\Ramo;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Validação da edição de ramo no modal de perfil da seguradora.
 */
class UpdateRamoRequest extends FormRequest
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
        // A seguradora do ramo não muda na edição — só existe pra escopar a
        // checagem de nome único (mesma regra de StoreRamoRequest).
        $seguradoraId = Ramo::find($this->route('id'))?->seguradora_id;

        return [
            'nome_ramo' => [
                'required',
                'string',
                'max:100',
                Rule::unique('ramos', 'nome_ramo')
                    ->where('seguradora_id', $seguradoraId)
                    ->ignore($this->route('id')),
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
