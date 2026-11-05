<?php

namespace App\Http\Controllers;

use Illuminate\Database\QueryException;

/**
 * Classe base de todos os controllers do sistema (padrão do Laravel).
 */
abstract class Controller
{
    /**
     * Texto do toast de erro a partir de uma exceção pega no controller.
     *
     * Mensagens de regra de negócio (as \Exception que nós mesmos lançamos,
     * ex.: "O prêmio informado não cobre...") passam como estão. Erros
     * internos — SQL do Postgres, nome de tabela/constraint, caminho de
     * arquivo, classe PHP — vão para o log e a tela recebe só uma mensagem
     * genérica: esses detalhes ajudam quem ataca a mapear o sistema e não
     * ajudam o usuário em nada.
     */
    protected function mensagemErro(\Throwable $e, ?string $prefixo = null): string
    {
        $inicio = $prefixo ? $prefixo.': ' : '';

        if (! $this->erroInterno($e)) {
            return $inicio.$e->getMessage();
        }

        report($e);

        return $inicio.'não foi possível concluir a operação. Tente de novo e, se continuar, fale com o administrador.';
    }

    /**
     * Diz se a exceção (ou alguma da cadeia) é erro interno. Os services
     * costumam embrulhar o erro do banco numa \Exception nova só com o texto
     * ("Erro ao ...: SQLSTATE[...]"), por isso a mensagem também é conferida.
     */
    private function erroInterno(\Throwable $e): bool
    {
        for ($atual = $e; $atual; $atual = $atual->getPrevious()) {
            if ($atual instanceof QueryException
                || $atual instanceof \PDOException
                || $atual instanceof \ErrorException
                || $atual instanceof \Error) {
                return true;
            }
        }

        return (bool) preg_match(
            '/SQLSTATE|\(Connection: |SQL: |\.php\b|on line \d+|[A-Za-z]+\\\\[A-Za-z]+\\\\/',
            $e->getMessage(),
        );
    }
}
