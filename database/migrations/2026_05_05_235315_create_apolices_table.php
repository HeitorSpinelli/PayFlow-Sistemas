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
            
            // Número da apólice (único, conforme sua validação)
            $table->string('numero_apolice')->unique();

            // Chaves Estrangeiras (Foreign Keys)
            // Certifique-se de que as tabelas 'clients', 'seguradoras' e 'ramos' já existam
            $table->foreignId('cliente_id')->constrained('clients')->onDelete('cascade');
            $table->foreignId('seguradora_id')->constrained('seguradoras')->onDelete('cascade');
            $table->foreignId('ramo_id')->constrained('ramos')->onDelete('cascade');

            // Valores Financeiros (usando decimal para precisão monetária)
            // 'valor_premio_total' representa o valor total do prêmio do seguro, ou seja, o custo total que o cliente pagará pelo seguro.
            // 'valor_cobertura' representa o valor máximo que a seguradora pagará em caso de sinistro, ou seja, o limite de cobertura do seguro.
            $table->decimal('valor_premio_total', 15, 2);
            $table->decimal('valor_cobertura', 15, 2);

            // Dados de Pagamento
            $table->integer('quantidade_parcelas');
            $table->string('forma_pagamento');

            // Vigência do Seguro (data de inicio e fim da cobertura/contrato)
            $table->date('inicio_vigencia');
            $table->date('fim_vigencia');

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('apolices');
    }
};