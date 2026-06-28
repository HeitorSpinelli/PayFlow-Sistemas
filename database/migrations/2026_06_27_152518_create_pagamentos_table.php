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
        Schema::create('pagamentos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('apolice_id')->constrained('apolices')->onDelete('cascade');
            $table->integer('parcela');
            $table->decimal('valor', 15, 2);
            $table->date('data_pagamento');
            $table->string('forma_pagamento', 50);
            $table->string('status', 50)->default('pendente');
            $table->text('observacoes')->nullable();
            $table->timestamps();

            //evita duas linhas no pagamento para a mesma parcela da apolice
            $table->unique(['apolice_id', 'parcela']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pagamentos');
    }
};
