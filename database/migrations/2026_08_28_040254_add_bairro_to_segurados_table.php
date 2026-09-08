<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('segurados', function (Blueprint $table) {
            $table->string('bairro', 100)->nullable()->after('endereco');
        });
    }

    public function down(): void
    {
        Schema::table('segurados', function (Blueprint $table) {
            $table->dropColumn('bairro');
        });
    }
};
