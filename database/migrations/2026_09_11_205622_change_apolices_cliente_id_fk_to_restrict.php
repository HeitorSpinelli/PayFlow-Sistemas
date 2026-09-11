<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * A aplicação nunca apaga um segurado de verdade — Segurado::delete()
     * é soft-delete, e SeguradoController::destroy() -> SeguradoService::destroy()
     * já cancela cada apólice do cliente uma a uma (ApoliceService::destroy():
     * marca motivo_cancelamento, soft-deleta parcelas/pagamentos) antes de
     * soft-deletar o segurado. O ON DELETE CASCADE da FK original nunca
     * deveria disparar em uso normal — mas se algum dia existir uma rotina
     * de expurgo com forceDelete() num segurado antigo, o cascade do banco
     * apagaria apólices/parcelas/pagamentos/dados-extra em definitivo,
     * pulando por completo essa lógica de negócio e o histórico que ela
     * preserva. Trocado para RESTRICT: um forceDelete num segurado com
     * apólices (de qualquer motivo) passa a falhar com erro de integridade
     * referencial em vez de apagar tudo silenciosamente em cascata.
     */
    public function up(): void
    {
        Schema::table('apolices', function (Blueprint $table) {
            $table->dropForeign(['cliente_id']);
        });

        Schema::table('apolices', function (Blueprint $table) {
            $table->foreign('cliente_id')
                ->references('id')->on('segurados')
                ->onDelete('restrict');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('apolices', function (Blueprint $table) {
            $table->dropForeign(['cliente_id']);
        });

        Schema::table('apolices', function (Blueprint $table) {
            $table->foreign('cliente_id')
                ->references('id')->on('segurados')
                ->onDelete('cascade');
        });
    }
};
