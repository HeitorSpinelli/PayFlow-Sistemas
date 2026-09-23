<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Rastro de autoria em pagamentos.
 *
 * A tabela registrava QUANTO e QUANDO, mas nunca QUEM. Num sistema que
 * movimenta dinheiro isso é uma falha de controle, não um detalhe: o
 * operador pode marcar uma parcela de R$ 5.000 como paga informando
 * R$ 0,01 (o modo "ajustar valor manualmente" aceita qualquer valor dentro
 * do teto de validação), ou estornar um pagamento legítimo — e depois não
 * há como saber quem fez, nem para auditar, nem para corrigir.
 *
 * nullOnDelete: o pagamento é fato contábil e não pode sumir junto com a
 * conta de um funcionário desligado; o vínculo é que se perde, virando
 * NULL. Nullable também porque os comandos agendados e os seeders criam
 * pagamentos sem usuário autenticado.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('pagamentos', function (Blueprint $table) {
            $table->foreignId('registrado_por')
                ->nullable()
                ->after('status')
                ->constrained('users')
                ->nullOnDelete();

            $table->foreignId('estornado_por')
                ->nullable()
                ->after('registrado_por')
                ->constrained('users')
                ->nullOnDelete();
        });

        // Índice só em registrado_por: é a coluna que uma auditoria filtra
        // ("tudo que o usuário X lançou"). estornado_por é raro o bastante
        // para não justificar o custo de manutenção de um índice.
        Schema::table('pagamentos', function (Blueprint $table) {
            $table->index('registrado_por');
        });
    }

    public function down(): void
    {
        Schema::table('pagamentos', function (Blueprint $table) {
            $table->dropIndex(['registrado_por']);
            $table->dropConstrainedForeignId('estornado_por');
            $table->dropConstrainedForeignId('registrado_por');
        });
    }
};
