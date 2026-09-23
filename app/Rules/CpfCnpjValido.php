<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

class CpfCnpjValido implements ValidationRule
{
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        // Remove tudo que não for dígito (pontos, traço, barra)
        $documento = preg_replace('/\D/', '', (string) $value);

        if (strlen($documento) === 11) {
            if (! CpfValido::checksumValido($documento)) {
                $fail('O CPF informado não é válido.');
            }

            return;
        }

        if (strlen($documento) === 14) {
            if (! CnpjValido::checksumValido($documento)) {
                $fail('O CNPJ informado não é válido.');
            }

            return;
        }

        // Não tem 11 nem 14 dígitos — não é CPF nem CNPJ possível
        $fail('O documento deve ter 11 dígitos (CPF) ou 14 dígitos (CNPJ).');
    }
}
