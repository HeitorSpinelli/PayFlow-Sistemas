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
            if (! $this->cpfValido($documento)) {
                $fail('O CPF informado não é válido.');
            }
            return;
        }

        if (strlen($documento) === 14) {
            if (! $this->cnpjValido($documento)) {
                $fail('O CNPJ informado não é válido.');
            }
            return;
        }

        // Não tem 11 nem 14 dígitos — não é CPF nem CNPJ possível
        $fail('O documento deve ter 11 dígitos (CPF) ou 14 dígitos (CNPJ).');
    }

    private function cpfValido(string $cpf): bool
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

    private function cnpjValido(string $cnpj): bool
    {
        // Rejeita sequências repetidas (11.111.111/1111-11, etc)
        if (preg_match('/^(\d)\1{13}$/', $cnpj)) {
            return false;
        }

        // Pesos fixos definidos pela Receita Federal para CNPJ
        $pesosPrimeiroDigito = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
        $pesosSegundoDigito = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

        $primeiroDigito = $this->calcularDigitoCnpj($cnpj, $pesosPrimeiroDigito, 12);
        if ((int) $cnpj[12] !== $primeiroDigito) {
            return false;
        }

        $segundoDigito = $this->calcularDigitoCnpj($cnpj, $pesosSegundoDigito, 13);
        if ((int) $cnpj[13] !== $segundoDigito) {
            return false;
        }

        return true;
    }

    private function calcularDigitoCnpj(string $cnpj, array $pesos, int $quantidadeDigitos): int
    {
        $soma = 0;

        for ($i = 0; $i < $quantidadeDigitos; $i++) {
            $soma += (int) $cnpj[$i] * $pesos[$i];
        }

        $resto = $soma % 11;

        return ($resto < 2) ? 0 : (11 - $resto);
    }
}