<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('parcelas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('apolice_id')->constrained('apolices')->onDelete('cascade');
            $table->integer('numero_parcela')->nullable(); // ex: 3 (da parcela 3/12)
            $table->decimal('valor_parcela', 15, 2)->nullable();
            $table->date('data_vencimento');
            $table->date('data_pagamento')->nullable();
            $table->string('status_pagamento', 50)->default('Pendente'); // 'Pago', 'Pendente', 'Atrasado'
            $table->string('forma_pagamento_efetiva', 50)->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('parcelas');
    }
};