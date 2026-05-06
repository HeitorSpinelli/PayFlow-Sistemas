<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    //Roda a migração para criar a tabela 'ramos' no banco de dados
    public function up(): void
    {
        //Schema para criar a tabela 'ramos' com os campos necessários para armazenar as informações dos ramos de seguro
        //blueprint para definir os campos da tabela, incluindo nome do ramo de seguro
        //(blueprint $table) é usado para definir a estrutura da tabela, como os tipos de dados e as restrições
        Schema::create('ramos', function (Blueprint $table) {
            $table->id();
            $table->string('nome_ramo'); // Nome do ramo de seguro
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ramos');
    }
};
