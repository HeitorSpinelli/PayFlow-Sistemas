<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('notificacoes', function (Blueprint $table) {
            $table->id();
            $table->string('tipo_notificacao', 100)->nullable(); // 'Lembrete de Vencimento', 'Cobrança', etc.
            $table->foreignId('segurado_id')->constrained('segurados')->onDelete('cascade');
            $table->string('canal', 50)->nullable(); // 'WhatsApp', 'E-mail', 'Ambos'
            $table->string('assunto_email', 255)->nullable();
            $table->text('mensagem')->nullable();
            $table->timestamp('data_envio')->nullable();
            $table->timestamp('data_agendamento')->nullable();
            $table->string('status', 50)->default('Pendente'); // 'Enviado', 'Pendente', 'Falha'
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('notificacoes');
    }
};