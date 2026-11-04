<?php

namespace App\Services\Importacoes;

use App\Rules\CnpjValido;
use App\Rules\CpfValido;
use Illuminate\Support\Str;

/**
 * Converte o que vem da planilha (digitado por gente, salvo pelo Excel) para
 * o formato do sistema. Cada método devolve null quando não consegue
 * interpretar o valor — quem chama decide se isso é erro ou aviso.
 */
class NormalizadorImportacao
{
    private const UFS = ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'];

    private const ESTADOS_POR_NOME = [
        'acre' => 'AC', 'alagoas' => 'AL', 'amapa' => 'AP', 'amazonas' => 'AM', 'bahia' => 'BA', 'ceara' => 'CE',
        'distrito federal' => 'DF', 'espirito santo' => 'ES', 'goias' => 'GO', 'maranhao' => 'MA', 'mato grosso' => 'MT',
        'mato grosso do sul' => 'MS', 'minas gerais' => 'MG', 'para' => 'PA', 'paraiba' => 'PB', 'parana' => 'PR',
        'pernambuco' => 'PE', 'piaui' => 'PI', 'rio de janeiro' => 'RJ', 'rio grande do norte' => 'RN',
        'rio grande do sul' => 'RS', 'rondonia' => 'RO', 'roraima' => 'RR', 'santa catarina' => 'SC',
        'sao paulo' => 'SP', 'sergipe' => 'SE', 'tocantins' => 'TO',
    ];

    /**
     * Texto limpo: sem espaços nas pontas nem repetidos.
     */
    public function texto(string $valor): string
    {
        return trim(preg_replace('/\s+/u', ' ', $valor));
    }

    /**
     * Chave para comparar nomes (seguradora, ramo): sem acento, minúscula.
     * "Caminhão" e "CAMINHAO" viram "caminhao".
     */
    public function chave(string $valor): string
    {
        return Str::of($this->texto($valor))->ascii()->lower()->toString();
    }

    /**
     * Datas em DD/MM/AAAA (padrão do Excel em português), D/M/AA,
     * AAAA-MM-DD, com ou sem hora, ou o número de série que o Excel usa
     * internamente (46023 = 01/01/2026). Devolve "AAAA-MM-DD" ou null.
     *
     * Importante: "03/09/2026" é 3 de setembro. O strtotime() do PHP leria
     * como 9 de março (padrão americano), por isso a leitura é manual.
     */
    public function data(string $valor): ?string
    {
        $valor = trim($valor);

        if ($valor === '') {
            return null;
        }

        // Número de série do Excel (dias desde 30/12/1899). Faixa 1954–2119
        // para não confundir com um ano digitado sozinho.
        if (preg_match('/^\d{5}(\.\d+)?$/', $valor) && (float) $valor >= 20000 && (float) $valor <= 80000) {
            // gmdate: o cálculo é em UTC; date() no fuso de Brasília (UTC-3)
            // devolveria o dia anterior.
            return gmdate('Y-m-d', ((int) $valor - 25569) * 86400);
        }

        // Tira a hora, se vier ("03/09/2026 00:00:00").
        $valor = preg_replace('/[ T]\d{1,2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:?\d{2})?$/', '', $valor);

        if (preg_match('/^(\d{4})[-\/.](\d{1,2})[-\/.](\d{1,2})$/', $valor, $m)) {
            [$ano, $mes, $dia] = [(int) $m[1], (int) $m[2], (int) $m[3]];
        } elseif (preg_match('/^(\d{1,2})[-\/.](\d{1,2})[-\/.](\d{2}|\d{4})$/', $valor, $m)) {
            [$dia, $mes, $ano] = [(int) $m[1], (int) $m[2], (int) $m[3]];

            if (strlen($m[3]) === 2) {
                // "26" → 2026; "85" → 1985 (nascimento).
                $ano += $ano <= ((int) date('y')) + 20 ? 2000 : 1900;
            }
        } else {
            return null;
        }

        if ($ano < 1900 || $ano > 2100 || ! checkdate($mes, $dia, $ano)) {
            return null;
        }

        return sprintf('%04d-%02d-%02d', $ano, $mes, $dia);
    }

    /**
     * Valores como 1.234,56 / 1234,56 / 1,234.56 / 1234.56 / R$ 342,50.
     * Regra: o separador mais à direita é decimal se tiver 1 ou 2 dígitos
     * depois dele; senão todos são de milhar ("2.500" = 2500, não 2,5).
     */
    public function dinheiro(string $valor): ?float
    {
        $negativo = str_contains($valor, '-') || preg_match('/^\s*\(.*\)\s*$/', $valor);
        $valor = preg_replace('/[^\d,.]/', '', $valor);

        if ($valor === '' || ! preg_match('/\d/', $valor)) {
            return null;
        }

        $ultimo = max(strrpos($valor, ',') === false ? -1 : strrpos($valor, ','), strrpos($valor, '.') === false ? -1 : strrpos($valor, '.'));

        if ($ultimo === -1) {
            $numero = (float) $valor;
        } else {
            $casas = strlen($valor) - $ultimo - 1;

            $numero = in_array($casas, [1, 2], true)
                ? (float) (preg_replace('/\D/', '', substr($valor, 0, $ultimo)).'.'.substr($valor, $ultimo + 1))
                : (float) preg_replace('/\D/', '', $valor);
        }

        return round($negativo ? -$numero : $numero, 2);
    }

    /**
     * CPF ou CNPJ, com ou sem pontuação.
     *
     * @return array{digitos: string|null, erro: string|null}
     */
    public function documento(string $valor): array
    {
        if (preg_match('/\d[.,]?\d*E\+?\d+/i', $valor)) {
            return ['digitos' => null, 'erro' => "o CPF/CNPJ \"{$valor}\" foi convertido pelo Excel em notação científica e perdeu dígitos. Formate a coluna como Texto e digite o número de novo."];
        }

        $digitos = preg_replace('/\D/', '', $valor);
        $original = $digitos;

        // O Excel apaga o zero à esquerda de números: CPF 012.345.678-90
        // digitado sem pontuação vira 1234567890. Completa e confere.
        if (in_array(strlen($digitos), [9, 10], true)) {
            $digitos = str_pad($digitos, 11, '0', STR_PAD_LEFT);
        } elseif (in_array(strlen($digitos), [12, 13], true)) {
            $digitos = str_pad($digitos, 14, '0', STR_PAD_LEFT);
        }

        if (strlen($digitos) === 11) {
            return CpfValido::checksumValido($digitos)
                ? ['digitos' => $digitos, 'erro' => null]
                : ['digitos' => null, 'erro' => "CPF \"{$valor}\" inválido (os dígitos verificadores não conferem)."];
        }

        if (strlen($digitos) === 14) {
            return CnpjValido::checksumValido($digitos)
                ? ['digitos' => $digitos, 'erro' => null]
                : ['digitos' => null, 'erro' => "CNPJ \"{$valor}\" inválido (os dígitos verificadores não conferem)."];
        }

        return ['digitos' => null, 'erro' => $original === ''
            ? 'CPF/CNPJ não preenchido.'
            : "CPF/CNPJ \"{$valor}\" inválido: precisa ter 11 dígitos (CPF) ou 14 (CNPJ)."];
    }

    /**
     * Mesma máscara do cadastro manual: 000.000.000-00 / 00.000.000/0000-00.
     */
    public function formatarDocumento(string $digitos): string
    {
        return strlen($digitos) === 11
            ? preg_replace('/(\d{3})(\d{3})(\d{3})(\d{2})/', '$1.$2.$3-$4', $digitos)
            : preg_replace('/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/', '$1.$2.$3/$4-$5', $digitos);
    }

    /**
     * Telefone com DDD → (11) 98765-4321 / (11) 3333-4444. Aceita +55 na frente.
     */
    public function telefone(string $valor): ?string
    {
        $digitos = preg_replace('/\D/', '', $valor);

        if (strlen($digitos) >= 12 && str_starts_with($digitos, '55')) {
            $digitos = substr($digitos, 2);
        }

        if (strlen($digitos) === 11 && str_starts_with($digitos, '0')) {
            $digitos = substr($digitos, 1); // 0 + DDD + número
        }

        return match (strlen($digitos)) {
            11 => preg_replace('/(\d{2})(\d{5})(\d{4})/', '($1) $2-$3', $digitos),
            10 => preg_replace('/(\d{2})(\d{4})(\d{4})/', '($1) $2-$3', $digitos),
            default => null,
        };
    }

    /**
     * CEP → 00000-000. Completa o zero à esquerda que o Excel apaga.
     */
    public function cep(string $valor): ?string
    {
        $digitos = preg_replace('/\D/', '', $valor);

        if (strlen($digitos) === 7) {
            $digitos = '0'.$digitos;
        }

        return strlen($digitos) === 8 ? substr($digitos, 0, 5).'-'.substr($digitos, 5) : null;
    }

    /**
     * "SP", "sp" ou "São Paulo" → "SP".
     */
    public function uf(string $valor): ?string
    {
        $sigla = strtoupper(trim($valor));

        if (in_array($sigla, self::UFS, true)) {
            return $sigla;
        }

        return self::ESTADOS_POR_NOME[$this->chave($valor)] ?? null;
    }

    /**
     * true = paga, false = não paga (em aberto/atrasada), null = texto não
     * reconhecido. Vazio conta como não paga.
     */
    public function pago(string $valor): ?bool
    {
        $chave = $this->chave($valor);

        if ($chave === '') {
            return false;
        }

        $pagos = ['pago', 'paga', 'pagos', 'pagas', 'quitado', 'quitada', 'liquidado', 'liquidada', 'recebido', 'recebida', 'baixado', 'baixada', 'sim', 's', '1', 'true', 'verdadeiro', 'x', 'ok', 'confirmado', 'confirmada'];
        $abertos = ['pendente', 'em aberto', 'aberto', 'aberta', 'a vencer', 'a pagar', 'atrasado', 'atrasada', 'vencido', 'vencida', 'em atraso', 'inadimplente', 'nao pago', 'nao paga', 'nao', 'n', '0', 'false', 'falso', 'em_aberto'];

        return match (true) {
            in_array($chave, $pagos, true) => true,
            in_array($chave, $abertos, true) => false,
            default => null,
        };
    }

    /**
     * Forma de pagamento no vocabulário do sistema (o mesmo do modal de
     * pagamento): boleto, pix, cartão ou débito.
     */
    public function formaPagamento(string $valor): ?string
    {
        $chave = $this->chave($valor);

        return match (true) {
            $chave === '' => null,
            str_contains($chave, 'boleto') || str_contains($chave, 'carne') => 'boleto',
            str_contains($chave, 'pix') => 'pix',
            str_contains($chave, 'debito') => 'débito',
            str_contains($chave, 'cartao') || str_contains($chave, 'credito') => 'cartão',
            default => null,
        };
    }

    /**
     * "3", "03", "3ª", "3/12", "3 de 12", "Parcela 3" → [3, 12|null].
     *
     * @return array{0: int, 1: int|null}|null
     */
    public function parcela(string $valor): ?array
    {
        $chave = $this->chave($valor);

        if (preg_match('/^(?:parcela\s*)?(\d{1,3})\s*[ao]?\s*(?:(?:\/|de)\s*(\d{1,3}))?$/', $chave, $m)) {
            $numero = (int) $m[1];
            $total = isset($m[2]) && $m[2] !== '' ? (int) $m[2] : null;

            if ($numero >= 1 && $numero <= 360 && ($total === null || $total >= $numero)) {
                return [$numero, $total];
            }
        }

        // Número que o Excel gravou como decimal ("3.0").
        if (preg_match('/^(\d{1,3})\.0+$/', $chave, $m) && (int) $m[1] >= 1) {
            return [(int) $m[1], null];
        }

        return null;
    }

    /**
     * Inteiro positivo ("12", "12.0").
     */
    public function inteiro(string $valor): ?int
    {
        return preg_match('/^\s*(\d{1,4})(\.0+)?\s*$/', $valor, $m) && (int) $m[1] > 0 ? (int) $m[1] : null;
    }

    public function email(string $valor): ?string
    {
        $email = Str::lower(trim($valor));

        return filter_var($email, FILTER_VALIDATE_EMAIL) ? $email : null;
    }
}
