<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Ramo extends Model
{
    // Ramos de cada contrato de seguro, como automóvel, residencial, vida, saúde, etc.
    protected $table = 'ramos';

    protected $fillable = [
        'nome_ramo',
        'categoria',
        'seguradora_id',
    ];

    // Categorias reconhecidas pelo sistema — controlam quais dados extras
    // a apólice desse ramo vai exigir no cadastro.
    public const CATEGORIA_VEICULO = 'veiculo';

    public const CATEGORIA_RESIDENCIAL = 'residencial';

    public const CATEGORIA_VIDA = 'vida';

    public const CATEGORIA_EMPRESARIAL = 'empresarial';

    public const CATEGORIA_OUTRO = 'outro';

    public function seguradora()
    {
        return $this->belongsTo(Seguradora::class, 'seguradora_id');
    }
}
