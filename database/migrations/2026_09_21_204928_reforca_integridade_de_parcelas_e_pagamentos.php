<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Completa em `parcelas`, `apolices` e `segurados` o trabalho que a migration
 * 2026_09_04_120000 já tinha feito em `pagamentos`: índices únicos que
 * respeitam o soft delete, CHECK nas colunas de dinheiro e índices nas
 * colunas de chave estrangeira.
 *
 * Os três problemas que isso fecha:
 *
 * 1. `parcelas` não tinha NENHUM índice único além da PK. Uma reimportação
 *    de CSV depois de um cancelamento criava uma segunda parcela viva com o
 *    mesmo numero_parcela (o updateOrCreate não enxerga a soft-deletada). O
 *    pagamento quitava uma; a outra ficava eterna, virava 'vencida',
 *    suspendia a apólice e em 30 dias o sistema cancelava uma apólice
 *    integralmente paga — e o índice único de `pagamentos` impedia registrar
 *    um segundo pagamento para quitá-la.
 *
 * 2. `apolices.numero_apolice` e `segurados.cpf_cnpj` tinham índice único
 *    NÃO-parcial, contando linhas soft-deletadas, enquanto os lookups que os
 *    precedem (firstOrNew) filtram por deleted_at. Resultado: o número de
 *    uma apólice cancelada ficava queimado para sempre, e a importação
 *    estourava QueryException em vez de reaproveitar o registro.
 *
 * 3. `constrained()` do Laravel cria a FK mas NÃO cria índice no PostgreSQL
 *    (diferente do MySQL, que indexa automaticamente). Toda leitura de
 *    parcelas era Seq Scan. Com a massa atual isso não custa nada (cabe em
 *    uma página), mas o custo cresce linear com a tabela e a varredura por
 *    FK roda a cada apólice apagada.
 */
return new class extends Migration
{
    public function up(): void
    {
        // --- 1) Unicidade lógica de parcela, respeitando o soft delete ---
        // Limpa duplicatas pré-existentes antes de criar o índice, senão a
        // criação falha. Mantém a de menor id (a original) e arquiva as
        // demais — arquiva, não apaga, porque pode haver pagamento apontando
        // para elas e o histórico financeiro não deve sumir sem auditoria.
        DB::statement("
            update parcelas p
               set deleted_at = now()
             where p.deleted_at is null
               and exists (
                   select 1 from parcelas anterior
                    where anterior.apolice_id = p.apolice_id
                      and anterior.numero_parcela = p.numero_parcela
                      and anterior.deleted_at is null
                      and anterior.id < p.id
               )
        ");

        DB::statement('
            create unique index parcelas_apolice_id_numero_parcela_unique
                on parcelas (apolice_id, numero_parcela)
             where deleted_at is null
        ');

        // --- 2) Uniques que passam a ignorar linhas arquivadas ---
        // DROP CONSTRAINT e não DROP INDEX: quando o unique nasce de um
        // ->unique() do Schema Builder, o Postgres o cria como CONSTRAINT
        // com um índice por trás, e recusa apagar o índice isoladamente
        // ("cannot drop index ... because constraint ... requires it").
        // Índice parcial não pode ser constraint, então o que entra no lugar
        // é um índice solto — daí o DROP INDEX no down().
        DB::statement('alter table apolices drop constraint if exists apolices_numero_apolice_unique');
        DB::statement('drop index if exists apolices_numero_apolice_unique');
        DB::statement('
            create unique index apolices_numero_apolice_unique
                on apolices (numero_apolice)
             where deleted_at is null
        ');

        DB::statement('alter table segurados drop constraint if exists segurados_cpf_cnpj_unique');
        DB::statement('drop index if exists segurados_cpf_cnpj_unique');
        DB::statement('
            create unique index segurados_cpf_cnpj_unique
                on segurados (cpf_cnpj)
             where deleted_at is null
        ');

        // --- 3) Índices nas colunas de FK e de filtro ---
        DB::statement('create index if not exists parcelas_apolice_id_index on parcelas (apolice_id)');
        DB::statement('create index if not exists pagamentos_apolice_id_index on pagamentos (apolice_id)');
        DB::statement('create index if not exists apolices_cliente_id_index on apolices (cliente_id)');

        // Composto na ordem (status, vencimento): serve o job que marca
        // vencidas, a checagem de inadimplência e os vencimentos próximos,
        // que sempre filtram por status primeiro e faixa de data depois.
        DB::statement('
            create index if not exists parcelas_status_vencimento_index
                on parcelas (status_pagamento, data_vencimento)
        ');

        // --- 4) Dinheiro não pode ser negativo, e pagamento não pode ser zero ---
        // Esta é a última linha de defesa: o valor gravado em `pagamentos` é
        // o que o service calcula, não o que o Form Request validou, então o
        // min:0.01 da validação não protege a escrita real.
        DB::statement('alter table pagamentos add constraint pagamentos_valor_positivo check (valor > 0)');
        DB::statement('alter table parcelas add constraint parcelas_valor_nao_negativo check (valor_parcela >= 0)');
    }

    public function down(): void
    {
        DB::statement('alter table parcelas drop constraint if exists parcelas_valor_nao_negativo');
        DB::statement('alter table pagamentos drop constraint if exists pagamentos_valor_positivo');

        DB::statement('drop index if exists parcelas_status_vencimento_index');
        DB::statement('drop index if exists apolices_cliente_id_index');
        DB::statement('drop index if exists pagamentos_apolice_id_index');
        DB::statement('drop index if exists parcelas_apolice_id_index');

        // Volta aos uniques não-parciais. Se existir colisão entre linha viva
        // e arquivada — exatamente o que o up() passou a permitir — a recriação
        // falha; por isso as duplicatas arquivadas são removidas antes.
        DB::statement('drop index if exists segurados_cpf_cnpj_unique');
        DB::statement('delete from segurados where deleted_at is not null and cpf_cnpj in (select cpf_cnpj from segurados where deleted_at is null)');
        DB::statement('alter table segurados add constraint segurados_cpf_cnpj_unique unique (cpf_cnpj)');

        DB::statement('drop index if exists apolices_numero_apolice_unique');
        DB::statement('delete from apolices where deleted_at is not null and numero_apolice in (select numero_apolice from apolices where deleted_at is null)');
        DB::statement('alter table apolices add constraint apolices_numero_apolice_unique unique (numero_apolice)');

        DB::statement('drop index if exists parcelas_apolice_id_numero_parcela_unique');
    }
};
