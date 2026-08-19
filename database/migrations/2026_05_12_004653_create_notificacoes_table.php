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
            $table->string('tipo_notificacao', 100)->nullable();
            $table->foreignId('user_id')->nullable()->constrained('users')->onDelete('set null');
            $table->foreignId('segurado_id')->constrained('segurados')->onDelete('cascade');
            $table->string('canal', 50)->nullable();
            $table->string('assunto_email', 255)->nullable();
            $table->text('mensagem')->nullable();
            $table->timestamp('data_envio')->nullable();
            $table->timestamp('data_agendamento')->nullable();
            $table->string('status', 50)->default('Pendente');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('notificacoes');
    }
};
