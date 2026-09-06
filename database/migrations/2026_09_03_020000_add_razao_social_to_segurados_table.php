<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Nullable: só se aplica a clientes PJ, e nem toda PJ pequena tem
        // razão social diferente do nome fantasia preenchido aqui.
        Schema::table('segurados', function (Blueprint $table) {
            $table->string('razao_social', 255)->nullable()->after('nome_completo');
        });
    }

    public function down(): void
    {
        Schema::table('segurados', function (Blueprint $table) {
            $table->dropColumn('razao_social');
        });
    }
};
