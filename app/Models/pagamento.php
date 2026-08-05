<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\Apolice;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class pagamento extends Model
{
    protected $fillable = [
        'apolice_id',
        'parcela',
        'valor',
        'data_pagamento',
        'forma_pagamento',
        'status',
        'observacoes',
    ];

    //esse daqui e parecido com o que eu fiz em apolice mas
    //aqui ele conecta o pagamento com a apolice assim permitindo
    //que eu use o pagamento->apolice para acessar os dados da apolice sem precisar fazer o maldito query manual
    public function Apolice(): BelongsTo
    {
        return $this->belongsTo(Apolice::class, 'apolice_id');
    }
}