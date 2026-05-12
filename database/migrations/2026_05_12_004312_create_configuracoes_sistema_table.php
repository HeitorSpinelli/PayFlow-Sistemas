<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('configuracoes_sistema', function (Blueprint $table) {
            $table->id();
            $table->string('razao_social', 255)->nullable();
            $table->string('nome_fantasia', 255)->nullable();
            $table->string('cnpj', 20)->unique()->nullable();
            $table->string('inscricao_estadual', 50)->nullable();//Estado de localização da empresa
            $table->text('endereco')->nullable();
            $table->string('telefone', 20)->nullable();
            $table->string('email_contato', 255)->nullable();
            $table->text('whatsapp_token')->nullable();
            $table->string('whatsapp_status', 50)->nullable(); // 'Ativo', 'Desconectado'
            $table->string('smtp_servidor', 255)->nullable();
            $table->string('smtp_user', 255)->nullable();
            $table->string('smtp_pass', 255)->nullable();
            $table->string('smtp_status', 50)->nullable(); // 'Configurado', 'Falha'
            $table->boolean('gateway_pagamento_ativo')->default(false);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('configuracoes_sistema');
    }
};