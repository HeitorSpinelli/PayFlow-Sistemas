<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

/**
 * Só valida CPF (11 dígitos) — diferente de CpfCnpjValido, que aceita os
 * dois formatos. Usada em campos que representam sempre uma pessoa física
 * (ex: CPF de beneficiário de apólice de vida), onde um CNPJ de 14 dígitos
 * nunca deveria ser aceito.
 */
class CpfValido implements ValidationRule
{
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        $documento = preg_replace('/\D/', '', (string) $value);

        if (strlen($documento) !== 11) {
            $fail('O CPF deve ter 11 dígitos.');

            return;
        }

        if (! self::checksumValido($documento)) {
            $fail('O CPF informado não é válido.');
        }
    }

    /**
     * Checagem pura do dígito verificador, sem o wrapper de ValidationRule
     * — reaproveitada por CpfCnpjValido pra não duplicar o mesmo cálculo.
     */
    public static function checksumValido(string $cpf): bool
    {
        // Rejeita sequências repetidas (111.111.111-11, 000.000.000-00, etc)
        // que passariam matematicamente no cálculo mas não são CPFs reais válidos
        if (preg_match('/^(\d)\1{10}$/', $cpf)) {
            return false;
        }

        for ($posicaoDigito = 9; $posicaoDigito <= 10; $posicaoDigito++) {
            $soma = 0;
            $peso = $posicaoDigito + 1;

            for ($i = 0; $i < $posicaoDigito; $i++) {
                $soma += (int) $cpf[$i] * $peso;
                $peso--;
            }

            $resto = $soma % 11;
            $digitoCalculado = ($resto < 2) ? 0 : (11 - $resto);

            if ((int) $cpf[$posicaoDigito] !== $digitoCalculado) {
                return false;
            }
        }

        return true;
    }
}
