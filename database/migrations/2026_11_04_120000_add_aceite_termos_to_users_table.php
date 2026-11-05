<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Registro do aceite dos Termos de Uso / Política de Privacidade / Termo de
 * Confidencialidade (janela exibida no primeiro acesso). Guarda qual versão
 * foi aceita, quando e de qual IP — a comprovação que a LGPD pede.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('termos_versao', 20)->nullable()->after('role');
            $table->timestamp('termos_aceitos_em')->nullable()->after('termos_versao');
            $table->string('termos_aceitos_ip', 45)->nullable()->after('termos_aceitos_em');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['termos_versao', 'termos_aceitos_em', 'termos_aceitos_ip']);
        });
    }
};
