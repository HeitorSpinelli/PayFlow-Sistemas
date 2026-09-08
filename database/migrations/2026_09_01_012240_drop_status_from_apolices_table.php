<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Coluna 'status' era preenchida manualmente no cadastro, mas o
        // sistema hoje usa status_vigencia (calculado dinamicamente pelas
        // datas de vigência) em todos os lugares que exibem/filtram status.
        // A coluna nunca é lida em lugar nenhum do código — removendo.
        if (Schema::hasColumn('apolices', 'status')) {
            Schema::table('apolices', function (Blueprint $table) {
                $table->dropColumn('status');
            });
        }
    }

    public function down(): void
    {
        Schema::table('apolices', function (Blueprint $table) {
            $table->string('status', 50)->nullable();
        });
    }
};
