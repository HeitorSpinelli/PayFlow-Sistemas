<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class HistoricoImportacao extends Model
{
    use HasFactory;

    protected $table = 'historico_importacoes';

    protected $fillable = [
        'nome_arquivo',
        'tipo_importacao',
        'usuario_id',
    ];
}
