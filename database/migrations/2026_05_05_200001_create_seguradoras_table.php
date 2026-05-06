<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    //Roda a migração para criar a tabela 'seguradoras' no banco de dados
    public function up(): void
    {
        //Schema para criar a tabela 'seguradoras' com os campos necessários para armazenar as informações das seguradoras parceiras
        //blueprint para definir os campos da tabela, incluindo nome fantasia, razão social, CNPJ, contato e email de suporte
        //(blueprint $table) é usado para definir a estrutura da tabela, como os tipos de dados e as restrições
        Schema::create('seguradoras', function (Blueprint $table) {
            $table->id();
            $table->string('nome_fantasia'); // Nome da seguradora
            $table->string('razao_social'); // Razão social da seguradora
            $table->string('cnpj')->unique(); // CNPJ da seguradora
            $table->string('contato_nome'); // Informações de contato da seguradora
            $table->string('email_suporte'); // Email de contato da seguradora
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('seguradoras');
    }
};
