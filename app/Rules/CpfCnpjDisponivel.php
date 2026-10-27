<?php

namespace App\Rules;

use App\Models\Segurado;
use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

/**
 * Impede cadastrar um cliente com CPF/CNPJ que já existe (inclusive na
 * lixeira). Usado no modal "Novo Cliente"; a mensagem aparece no campo CPF/CNPJ.
 */
class CpfCnpjDisponivel implements ValidationRule
{
    /**
     * Compara só os dígitos e diferencia "já cadastrado" de "cliente excluído —
     * restaure na lixeira".
     */
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        // cpf_cnpj é salvo com a máscara exatamente como o formulário manda
        // (ex: "529.982.247-25"). Comparar a string crua deixava passar o
        // mesmo documento sem pontuação (ex: "52998224725") como se fosse
        // outro cliente — normaliza os dois lados pra dígitos antes de
        // comparar, igual o CpfCnpjValido já faz pra checar o dígito verificador.
        $documento = preg_replace('/\D/', '', (string) $value);

        $existente = Segurado::withTrashed()
            ->whereRaw("regexp_replace(cpf_cnpj, '\\D', '', 'g') = ?", [$documento])
            ->first();

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
