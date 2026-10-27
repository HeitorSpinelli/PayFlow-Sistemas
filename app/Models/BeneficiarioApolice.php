<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Beneficiário de uma apólice de vida — lista de beneficiários dos modais de
 * criar/editar apólice.
 */
class BeneficiarioApolice extends Model
{
    protected $table = 'beneficiarios_apolice';

    protected $fillable = [
        'apolice_id',
        'nome_completo',
        'cpf',
        'data_nascimento',
        'parentesco',
        'percentual_indenizacao',
    ];

    protected $casts = [
        'data_nascimento' => 'date',
    ];

    /**
     * Apólice de vida a que o beneficiário pertence.
     */
    public function apolice(): BelongsTo
    {
        return $this->belongsTo(Apolice::class, 'apolice_id');
    }
}
