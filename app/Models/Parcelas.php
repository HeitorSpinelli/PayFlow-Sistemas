<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Models\Apolice;
use Carbon\Carbon;
use Carbon\CarbonInterface;

class Parcelas extends Model
{
    use SoftDeletes;

    //model para representar as parcelas de cada contrato de seguro, incluindo o número da parcela, valor, data de vencimento, status de pagamento, etc.
    protected $table = 'parcelas';
    protected $fillable = [
        'apolice_id',
        'numero_parcela',
        'valor_parcela',
        'data_vencimento',
        'data_pagamento',
        'status_pagamento',
        'forma_pagamento_efetiva'
    ];

    public function apolice(): BelongsTo
    {
        return $this->belongsTo(Apolice::class, 'apolice_id');
    }

    /**
     * Dias de atraso até a data de referência informada (por padrão, hoje).
     * Passar a data de pagamento real permite calcular o atraso de verdade
     * em lançamentos retroativos, em vez de sempre contar até "agora".
     */
    public function diasEmAtraso(?CarbonInterface $dataReferencia = null): int
    {
        if ($this->status_pagamento === 'paga') {
            return 0;
        }

        $vencimento = Carbon::parse($this->data_vencimento)->startOfDay();
        $referencia = ($dataReferencia ?? now())->copy()->startOfDay();

        if ($referencia->lte($vencimento)) {
            return 0;
        }

        return abs($referencia->diffInDays($vencimento));
    }
}
