<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('ramos', function (Blueprint $table) {
            // 'outro' como padrão: ramos já cadastrados (vida, saúde, etc.) continuam
            // funcionando sem dados extras até alguém revisar a categoria deles.
            $table->string('categoria', 20)->default('outro')->after('nome_ramo');
        });
    }

    public function down(): void
    {
        Schema::table('ramos', function (Blueprint $table) {
            $table->dropColumn('categoria');
        });
    }
};
