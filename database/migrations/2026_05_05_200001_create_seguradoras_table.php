<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('seguradoras', function (Blueprint $table) {
            $table->id();
            $table->string('nome_fantasia', 255);
            $table->string('razao_social', 255)->nullable();
            $table->string('cnpj', 20)->unique();
            $table->string('contato_nome', 255)->nullable();
            $table->string('email_suporte', 255)->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('seguradoras');
    }
};