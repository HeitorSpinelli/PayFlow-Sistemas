<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('apolices', function (Blueprint $table) {
            // 'manual' | 'atraso_primeira_parcela' | 'suspensao_prolongada' | 'renovada'.
            // Só preenchido quando a apólice é cancelada (deleted_at) — decide se
            // o botão "Restaurar" pode aparecer (ver Apolice::podeSerRestaurada()).
            $table->string('motivo_cancelamento', 50)->nullable()->after('suspensa_em');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('apolices', function (Blueprint $table) {
            $table->dropColumn('motivo_cancelamento');
        });
    }
};
