<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * O índice único (apolice_id, parcela) contava linhas soft-deletadas,
     * então excluir um pagamento bloqueava pra sempre um novo registro pra
     * mesma parcela. Troca por um índice parcial que ignora deleted_at.
     */
    public function up(): void
    {
        Schema::table('pagamentos', function ($table) {
            $table->dropUnique('pagamentos_apolice_id_parcela_unique');
        });

        DB::statement(
            'CREATE UNIQUE INDEX pagamentos_apolice_id_parcela_unique ON pagamentos (apolice_id, parcela) WHERE deleted_at IS NULL'
        );
    }

    public function down(): void
    {
        DB::statement('DROP INDEX IF EXISTS pagamentos_apolice_id_parcela_unique');

        Schema::table('pagamentos', function ($table) {
            $table->unique(['apolice_id', 'parcela']);
        });
    }
};
