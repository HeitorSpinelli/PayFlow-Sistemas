<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Os defaults originais ('Pendente'/'pendente') nunca bateram com o
     * vocabulário que o código realmente usa ('em_aberto'/'paga'/'vencida'
     * em parcelas, só 'confirmado' em pagamentos). Inofensivo até agora
     * porque toda inserção sempre define o status explicitamente — mas um
     * default que nenhuma query do sistema reconhece é uma armadilha pra
     * qualquer inserção futura que confiar nele.
     */
    public function up(): void
    {
        DB::statement("ALTER TABLE parcelas ALTER COLUMN status_pagamento SET DEFAULT 'em_aberto'");
        DB::statement("ALTER TABLE pagamentos ALTER COLUMN status SET DEFAULT 'confirmado'");
    }

    public function down(): void
    {
        DB::statement("ALTER TABLE parcelas ALTER COLUMN status_pagamento SET DEFAULT 'Pendente'");
        DB::statement("ALTER TABLE pagamentos ALTER COLUMN status SET DEFAULT 'pendente'");
    }
};
