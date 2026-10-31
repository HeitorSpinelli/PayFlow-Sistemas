<?php

namespace App\Models;

use App\Models\Concerns\Auditavel;
use Illuminate\Database\Eloquent\Model;

/**
 * Ramo (tipo de seguro) oferecido por uma seguradora. Cadastrado/editado nos
 * modais da tela Seguradoras e escolhido no select de ramo dos modais de apólice.
 */
class Ramo extends Model
{
    use Auditavel;

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

    /**
     * Seguradora dona do ramo.
     */
    public function seguradora()
    {
        return $this->belongsTo(Seguradora::class, 'seguradora_id');
    }

    /* Log de auditoria (trait Auditavel) */

    public function auditoriaModulo(): string
    {
        return 'Ramo';
    }

    public function auditoriaDescricao(): string
    {
        $seguradora = $this->seguradora()->value('nome_fantasia');

        return $this->nome_ramo.($seguradora ? ' — '.$seguradora : '');
    }
}
