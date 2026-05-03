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

        $table->string('tipo_cliente'); // pf ou pj
        $table->string('nome');

        $table->string('email')->nullable();
        $table->string('telefone')->nullable();

        // Pessoa Física
        $table->string('cpf')->nullable();
        $table->date('data_nascimento')->nullable();

        // Pessoa Jurídica
        $table->string('cnpj')->nullable();
        $table->date('data_fundacao')->nullable();

        $table->timestamps();
    });
}

    public function down(): void
    {
        Schema::dropIfExists('clients');
    }
};
