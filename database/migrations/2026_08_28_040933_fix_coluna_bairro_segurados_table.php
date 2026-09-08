<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Corrige bancos que passaram pelo bug histórico da coluna "100"
        // (nome errado gerado por um $table->string(100) sem o parâmetro
        // do nome). Verifica antes de agir: num banco criado do zero
        // (migrate:fresh, ambiente novo), essa coluna nunca existe, então
        // essa migration simplesmente não faz nada — evitando o erro
        // "column 100 does not exist" que travava o migrate:fresh.
        if (Schema::hasColumn('segurados', '100')) {
            Schema::table('segurados', function (Blueprint $table) {
                $table->dropColumn('100');
            });
        }
    }

    public function down(): void
    {
        // Não há como reverter com segurança — essa migration corrige
        // um estado histórico específico, não uma mudança de schema normal.
    }
};