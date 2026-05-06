<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void{
        Schema::create('parcelas', function (Blueprint $table) {
            $table->id();
            //onDelete cascade para garantir que, se uma apólice for deletada, as parcelas associadas a ela também sejam deletadas automaticamente, mantendo a integridade referencial do banco de dados.
            //foreignId para criar uma chave estrangeira que referencia a tabela 'apolices', garantindo que cada parcela esteja associada a uma apólice específica e garantindo que nunca haja mais de uma parcela por contrato repetida.
            $table->foreignId('apolice_id')->constrained('apolices')->onDelete('cascade');
            $table->integer('numero_parcela');
            $table->decimal('valor_parcela', 15, 2);
            $table->date('data_vencimento');
            $table->string('status_pagamento'); // Ex: 'Pendente', 'Pago', 'Atrasado'
            $table->timestamps();
        });
    }
};
