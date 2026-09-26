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
            // Antes disso, uma notificação com status "Falha" não guardava
            // motivo nenhum — só ia pro log do servidor (Log::error em
            // NotificacaoService::criarEEnviar), inacessível pra quem só usa
            // a tela. Achado em teste exploratório: 15 notificações com
            // "Falha" na tela e nenhuma pista de por quê.
            $table->text('erro')->nullable()->after('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('notificacoes', function (Blueprint $table) {
            $table->dropColumn('erro');
        });
    }
};
