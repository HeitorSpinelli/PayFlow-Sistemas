<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
{
    Schema::create('clients', function (Blueprint $table) {
        $table->id();

        $table->string('tipo_pessoa'); // pf ou pj
        $table->string('nome_completo');

        $table->string('email')->nullable();
        $table->string('telefone')->nullable();

        // Pessoa Física e Jurídica
        $table->string('cpf_cnpj')->nullable();
        $table->date('data_nascimento-data_fundacao')->nullable();

        $table->string('endereco')->nullable();
        $table->string('cidade')->nullable();
        $table->string('estado')->nullable();
        $table->string('cep')->nullable();
        $table->string('status')->default('ativo'); // ativo ou inativo
        
        $table->timestamps();
    });
}

    public function down(): void
    {
        Schema::dropIfExists('clients');
    }
};
