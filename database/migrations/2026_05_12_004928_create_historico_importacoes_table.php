<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        //Criação de tabela historico importações
        Schema::create('historico_importacoes', function (Blueprint $table) {
            $table->id();
            $table->string('nome_arquivo', 255)->nullable();
            $table->string('tipo_importacao', 100)->nullable(); // 'Clientes', 'Apólices', etc.
            $table->foreignId('usuario_id')->constrained('users')->onDelete('cascade');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('historico_importacoes');
    }
};