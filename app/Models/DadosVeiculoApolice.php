<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DadosVeiculoApolice extends Model
{
    protected $table = 'dados_veiculo_apolice';

    protected $fillable = [
        'apolice_id',
        'tipo_veiculo',
        'placa',
        'renavam',
        'chassi',
        'marca',
        'modelo',
        'ano_fabricacao',
        'ano_modelo',
        'cor',
        'combustivel',
        'uso',
        'cep_pernoite',
        'possui_rastreador',
        'nome_condutor_principal',
        'cpf_condutor_principal',
        'data_nascimento_condutor_principal',
    ];

    protected $casts = [
        'possui_rastreador' => 'boolean',
        'data_nascimento_condutor_principal' => 'date',
    ];

    public function apolice(): BelongsTo
    {
        return $this->belongsTo(Apolice::class, 'apolice_id');
    }
}
