<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Um-para-muitos de verdade (uma apólice de vida pode ter vários
        // beneficiários) — por isso NÃO tem unique() em apolice_id, diferente
        // de dados_vida_apolice/dados_empresarial_apolice.
        Schema::create('beneficiarios_apolice', function (Blueprint $table) {
            $table->id();
            $table->foreignId('apolice_id')->constrained('apolices')->onDelete('cascade');

            $table->string('nome_completo', 255);
            $table->string('cpf', 20);
            $table->date('data_nascimento');
            $table->string('parentesco', 20); // conjuge, filho, pai, mae, irmao, outro
            $table->decimal('percentual_indenizacao', 5, 2); // soma dos beneficiários de uma apólice deve fechar em 100

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('beneficiarios_apolice');
    }
};
