<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DadosEmpresarialApolice extends Model
{
    protected $table = 'dados_empresarial_apolice';

    protected $fillable = [
        'apolice_id',
        'cnae_ou_atividade',
        'numero_funcionarios',
        'valor_patrimonio_segurado',
        'faturamento_anual',
        'possui_cobertura_incendio_basica',
        'coberturas_adicionais',
        'endereco_estabelecimento',
        'numero_estabelecimento',
        'bairro_estabelecimento',
        'cidade_estabelecimento',
        'estado_estabelecimento',
        'cep_estabelecimento',
    ];

    protected $casts = [
        'possui_cobertura_incendio_basica' => 'boolean',
    ];

    public function apolice(): BelongsTo
    {
        return $this->belongsTo(Apolice::class, 'apolice_id');
    }
}
