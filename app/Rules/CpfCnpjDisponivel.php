<?php

namespace App\Rules;

use App\Models\Segurado;
use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

class CpfCnpjDisponivel implements ValidationRule
{
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        $existente = Segurado::withTrashed()->where('cpf_cnpj', $value)->first();

        if (! $existente) {
            return;
        }

        if ($existente->trashed()) {
            $fail('Este CPF/CNPJ já pertence a um cliente excluído. Restaure o cadastro na lista de clientes inativos em vez de cadastrar novamente.');

            return;
        }

        $fail('O CPF/CNPJ informado já está cadastrado.');
    }
}
