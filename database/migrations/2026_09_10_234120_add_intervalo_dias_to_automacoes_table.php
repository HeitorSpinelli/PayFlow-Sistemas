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
        Schema::table('automacoes', function (Blueprint $table) {
            // Nulo = dispara uma única vez, exatamente em "dias" (comportamento
            // atual preservado). Preenchido = repete a cada N dias enquanto a
            // condição estiver dentro da janela de "dias".
            $table->unsignedInteger('intervalo_dias')->nullable()->after('dias');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('automacoes', function (Blueprint $table) {
            $table->dropColumn('intervalo_dias');
        });
    }
};
