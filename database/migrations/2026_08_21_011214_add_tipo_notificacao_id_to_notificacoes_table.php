<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('notificacoes', function (Blueprint $table) {
            $table->dropColumn('tipo_notificacao');
            $table->dropColumn('assunto_email');
            $table->foreignId('tipo_notificacao_id')->nullable()->constrained('tipos_notificacao')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('notificacoes', function (Blueprint $table) {
            $table->dropForeign(['tipo_notificacao_id']);
            $table->dropColumn('tipo_notificacao_id');
            $table->string('tipo_notificacao', 100)->nullable();
            $table->string('assunto_email', 255)->nullable();
        });
    }
};
