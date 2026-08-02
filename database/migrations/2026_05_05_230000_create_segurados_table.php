<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        //Criação da tabela segurados
        Schema::create('segurados', function (Blueprint $table) {
            $table->id();
            $table->string('nome_completo', 255);
            $table->string('tipo_pessoa', 20)->nullable(); // 'Física' ou 'Jurídica'
            $table->string('cpf_cnpj', 20)->unique();
            $table->date('data_nascimento_fundacao')->nullable();
            $table->string('email', 255)->nullable();
            $table->string('telefone_fixo', 20)->nullable();
            $table->string('celular_whatsapp', 20)->nullable();
            $table->text('endereco')->nullable();
            $table->string('cidade', 100)->nullable();
            $table->char('estado', 2)->nullable();
            $table->string('cep', 15)->nullable();
            $table->text('observacoes')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('segurados');
    }
};