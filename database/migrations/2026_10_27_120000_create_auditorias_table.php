<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Log de auditoria: quem criou, editou, excluiu, estornou ou restaurou o quê,
 * e quando. Alimentado automaticamente pelo trait App\Models\Concerns\Auditavel
 * e exibido na tela Auditoria (só admin).
 *
 * nullOnDelete em user_id: o registro de auditoria precisa sobreviver à
 * exclusão do usuário que fez a ação. user_id NULL também representa ações
 * do próprio sistema (jobs e comandos agendados, sem usuário logado).
 *
 * descricao guarda o rótulo do registro NO MOMENTO da ação ("Apólice 123 —
 * Maria"), para o log continuar legível mesmo depois que o registro for
 * apagado ou renomeado.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('auditorias', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('acao', 20);
            $table->string('modulo', 40);
            $table->string('auditavel_type');
            $table->unsignedBigInteger('auditavel_id')->nullable();
            $table->string('descricao');
            $table->json('alteracoes')->nullable();
            $table->string('ip', 45)->nullable();
            $table->timestamp('created_at')->useCurrent();

            // created_at: a tela lista do mais recente para o mais antigo e
            // filtra por período. As outras são os filtros da tela.
            $table->index('created_at');
            $table->index(['auditavel_type', 'auditavel_id']);
            $table->index('user_id');
            $table->index('modulo');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('auditorias');
    }
};
