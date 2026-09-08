<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Campos baseados no que seguradoras reais (Porto Seguro, Bradesco Auto,
        // Azul Seguros, Tokio Marine) pedem numa cotação/apólice de veículo:
        // identificação do bem (placa/Renavam/chassi), perfil de risco (uso,
        // CEP de pernoite, rastreador) e condutor principal quando diferente
        // do segurado — todos afetam diretamente o valor do prêmio real.
        Schema::create('dados_veiculo_apolice', function (Blueprint $table) {
            $table->id();
            $table->foreignId('apolice_id')->unique()->constrained('apolices')->onDelete('cascade');

            $table->string('tipo_veiculo', 20); // carro, moto, caminhonete, caminhao, outro
            $table->string('placa', 8);
            $table->string('renavam', 11);
            $table->string('chassi', 17);
            $table->string('marca', 50);
            $table->string('modelo', 100);
            $table->unsignedSmallInteger('ano_fabricacao');
            $table->unsignedSmallInteger('ano_modelo');
            $table->string('cor', 30);
            $table->string('combustivel', 20); // gasolina, etanol, flex, diesel, eletrico, hibrido
            $table->string('uso', 20); // particular, comercial, aplicativo
            $table->string('cep_pernoite', 15); // onde o veículo dorme — pesa bastante no risco/prêmio real

            $table->boolean('possui_rastreador')->default(false);

            // Preenchido só quando o condutor principal não é o próprio segurado
            $table->string('nome_condutor_principal', 255)->nullable();
            $table->string('cpf_condutor_principal', 20)->nullable();
            $table->date('data_nascimento_condutor_principal')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('dados_veiculo_apolice');
    }
};
