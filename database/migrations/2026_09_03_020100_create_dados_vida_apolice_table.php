<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Campos baseados no questionário real de seguro de vida (Porto Seguro
        // Vida, Bradesco Vida): profissão, tabagismo e doença preexistente são
        // os clássicos fatores de risco de saúde; atividade profissional de
        // risco e prática de esporte de risco são perguntados SEPARADAMENTE
        // porque um afeta o risco independente do outro.
        Schema::create('dados_vida_apolice', function (Blueprint $table) {
            $table->id();
            $table->foreignId('apolice_id')->unique()->constrained('apolices')->onDelete('cascade');

            $table->string('profissao', 150);
            $table->boolean('possui_atividade_profissional_risco')->default(false);
            $table->boolean('fumante')->default(false);

            $table->boolean('possui_doenca_preexistente')->default(false);
            $table->text('descricao_doencas')->nullable();

            $table->boolean('pratica_esporte_risco')->default(false);
            $table->string('qual_esporte', 150)->nullable();

            $table->decimal('capital_segurado', 12, 2);

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('dados_vida_apolice');
    }
};
