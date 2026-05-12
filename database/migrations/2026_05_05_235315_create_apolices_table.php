
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('apolices', function (Blueprint $table) {
            $table->id();
            $table->string('numero_apolice', 100)->unique();
            $table->foreignId('cliente_id')->constrained('segurados')->onDelete('cascade');
            $table->foreignId('seguradora_id')->constrained('seguradoras')->onDelete('restrict');
            $table->foreignId('ramo_id')->constrained('ramos')->onDelete('restrict');
            $table->decimal('valor_premio_total', 15, 2)->nullable();
            $table->decimal('valor_cobertura', 15, 2)->nullable();
            $table->integer('quantidade_parcelas')->nullable();
            $table->string('forma_pagamento', 50)->nullable(); // 'Boleto', 'PIX', 'Cartão'
            $table->date('inicio_vigencia')->nullable();
            $table->date('fim_vigencia')->nullable();
            $table->string('status', 50)->nullable(); // 'Ativa', 'Vencida', 'Inadimplente', 'A renovar'
            $table->text('observacoes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('apolices');
    }
};