<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('indicadores_economicos', function (Blueprint $table) {
            $table->id();
            $table->string('indicador', 20); // 'selic' ou 'ipca_12m'
            $table->decimal('valor', 10, 4); // percentual, ex: 10.7500 (= 10,75%)
            $table->date('data_referencia'); // data à qual o valor se refere, segundo o BCB
            $table->timestamp('atualizado_em'); // quando o NOSSO sistema buscou esse valor
            $table->timestamps();

            $table->index('indicador');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('indicadores_economicos');
    }
};