<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

/**
 * Só valida CNPJ (14 dígitos) — diferente de CpfCnpjValido, que aceita os
 * dois formatos. Usada em campos que representam sempre uma pessoa
 * jurídica (ex: CNPJ da seguradora), onde um CPF de 11 dígitos nunca
 * deveria ser aceito mesmo que matematicamente válido.
 */
class CnpjValido implements ValidationRule
{
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        $documento = preg_replace('/\D/', '', (string) $value);

        if (strlen($documento) !== 14) {
            $fail('O CNPJ deve ter 14 dígitos.');

            return;
        }

        if (! self::checksumValido($documento)) {
            $fail('O CNPJ informado não é válido.');
        }
    }

    /**
     * Checagem pura do dígito verificador, sem o wrapper de ValidationRule
     * — reaproveitada por CpfCnpjValido pra não duplicar o mesmo cálculo.
     */
    public static function checksumValido(string $cnpj): bool
    {
        // Rejeita sequências repetidas (11.111.111/1111-11, etc) que
        // passariam matematicamente no cálculo mas não são CNPJs reais válidos
        if (preg_match('/^(\d)\1{13}$/', $cnpj)) {
            return false;
        }

        // Pesos fixos definidos pela Receita Federal para CNPJ
        $pesosPrimeiroDigito = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
        $pesosSegundoDigito = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

        $primeiroDigito = self::calcularDigito($cnpj, $pesosPrimeiroDigito, 12);
        if ((int) $cnpj[12] !== $primeiroDigito) {
            return false;
        }

        $segundoDigito = self::calcularDigito($cnpj, $pesosSegundoDigito, 13);

        return (int) $cnpj[13] === $segundoDigito;
    }

    private static function calcularDigito(string $cnpj, array $pesos, int $quantidadeDigitos): int
    {
        $soma = 0;

        for ($i = 0; $i < $quantidadeDigitos; $i++) {
            $soma += (int) $cnpj[$i] * $pesos[$i];
        }

        $resto = $soma % 11;

        return ($resto < 2) ? 0 : (11 - $resto);
    }
}
