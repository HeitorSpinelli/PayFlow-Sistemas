<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Dados extras de apólice de vida — bloco "vida" dos modais de criar/editar
 * apólice (os beneficiários ficam em BeneficiarioApolice).
 */
class DadosVidaApolice extends Model
{
    protected $table = 'dados_vida_apolice';

    protected $fillable = [
        'apolice_id',
        'profissao',
        'possui_atividade_profissional_risco',
        'fumante',
        'possui_doenca_preexistente',
        'descricao_doencas',
        'pratica_esporte_risco',
        'qual_esporte',
        'capital_segurado',
    ];

    protected $casts = [
        'possui_atividade_profissional_risco' => 'boolean',
        'fumante' => 'boolean',
        'possui_doenca_preexistente' => 'boolean',
        'pratica_esporte_risco' => 'boolean',
    ];

    /**
     * Apólice dona destes dados.
     */
    public function apolice(): BelongsTo
    {
        return $this->belongsTo(Apolice::class, 'apolice_id');
    }
}
