<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Endereço do estabelecimento decomposto em campos (não um texto só),
        // mesmo padrão do imóvel em dados_residencia_apolice — pode ser
        // diferente do endereço cadastral da empresa em segurados.
        Schema::create('dados_empresarial_apolice', function (Blueprint $table) {
            $table->id();
            $table->foreignId('apolice_id')->unique()->constrained('apolices')->onDelete('cascade');

            $table->string('cnae_ou_atividade', 255);
            $table->unsignedInteger('numero_funcionarios');
            $table->decimal('valor_patrimonio_segurado', 14, 2);
            $table->decimal('faturamento_anual', 14, 2);

            // Cobertura de incêndio é obrigatória por lei (Decreto-lei 73/1966)
            // em qualquer seguro empresarial — default true, mas registrado
            // explicitamente em vez de assumido implicitamente.
            $table->boolean('possui_cobertura_incendio_basica')->default(true);
            $table->text('coberturas_adicionais')->nullable();

            $table->text('endereco_estabelecimento');
            $table->string('numero_estabelecimento', 20);
            $table->string('bairro_estabelecimento', 100);
            $table->string('cidade_estabelecimento', 100);
            $table->char('estado_estabelecimento', 2);
            $table->string('cep_estabelecimento', 15);

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('dados_empresarial_apolice');
    }
};
