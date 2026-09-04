<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DadosResidenciaApolice extends Model
{
    protected $table = 'dados_residencia_apolice';

    protected $fillable = [
        'apolice_id',
        'tipo_imovel',
        'tipo_construcao',
        'endereco_imovel',
        'numero',
        'complemento',
        'bairro_imovel',
        'cidade_imovel',
        'estado_imovel',
        'cep_imovel',
        'area_construida_m2',
        'ano_construcao',
        'ocupacao',
        'possui_sistema_seguranca',
    ];

    protected $casts = [
        'possui_sistema_seguranca' => 'boolean',
        'area_construida_m2' => 'decimal:2',
    ];

    public function apolice(): BelongsTo
    {
        return $this->belongsTo(Apolice::class, 'apolice_id');
    }
}
