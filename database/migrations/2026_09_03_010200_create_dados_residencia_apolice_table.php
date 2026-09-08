<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Campos baseados no que seguradoras reais pedem numa apólice
        // residencial: endereço do IMÓVEL segurado (pode ser diferente do
        // endereço do segurado, ex: casa de praia), material de construção e
        // ocupação (residência habitual x desocupado) — dois dos fatores que
        // mais pesam no risco de incêndio/furto de um seguro residencial real.
        Schema::create('dados_residencia_apolice', function (Blueprint $table) {
            $table->id();
            $table->foreignId('apolice_id')->unique()->constrained('apolices')->onDelete('cascade');

            $table->string('tipo_imovel', 20); // casa, apartamento, sobrado, outro
            $table->string('tipo_construcao', 20); // alvenaria, madeira, mista

            $table->text('endereco_imovel');
            $table->string('numero', 20);
            $table->string('complemento', 100)->nullable();
            $table->string('bairro_imovel', 100);
            $table->string('cidade_imovel', 100);
            $table->char('estado_imovel', 2);
            $table->string('cep_imovel', 15);

            $table->decimal('area_construida_m2', 8, 2);
            $table->unsignedSmallInteger('ano_construcao')->nullable();

            // residencia_habitual, veraneio, alugado, desocupado — imóvel
            // desocupado é um dos maiores fatores de risco num sinistro real
            $table->string('ocupacao', 20);

            $table->boolean('possui_sistema_seguranca')->default(false);

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('dados_residencia_apolice');
    }
};
