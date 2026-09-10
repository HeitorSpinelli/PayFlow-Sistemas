<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Null = garantia normal. Preenchida = suspensa por atraso de parcela
        // 2ª em diante (Lei 15.040/2024, art. 21) — se ficar suspensa por mais
        // de 30 dias sem o pagamento regularizar, a apólice é cancelada.
        Schema::table('apolices', function (Blueprint $table) {
            $table->timestamp('suspensa_em')->nullable()->after('fim_vigencia');
        });
    }

    public function down(): void
    {
        Schema::table('apolices', function (Blueprint $table) {
            $table->dropColumn('suspensa_em');
        });
    }
};
