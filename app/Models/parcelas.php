<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class parcelas extends Model
{
    //model para representar as parcelas de cada contrato de seguro, incluindo o número da parcela, valor, data de vencimento, status de pagamento, etc.
    protected $table = 'parcelas';
    protected $fillable = [
        'id', // ID da parcela
        'apolice_id', // ID da apólice associada à parcela
        'numero_parcela', // Número da parcela (ex: 1, 2, 3, etc.)
        'valor_parcela', // Valor da parcela
        'data_vencimento', // Data de vencimento da parcela
        'data_pagamento', // Data de pagamento da parcela (pode ser nula se ainda não tiver sido paga)
        'status_pagamento', // Status do pagamento (ex: 'Pendente', 'Pago', 'Atrasado')
        'forma_pagamento_efetiva'// Forma de pagamento (ex: 'Cartão de Crédito', 'Boleto', 'Transferência Bancária', etc.)
    ];
}