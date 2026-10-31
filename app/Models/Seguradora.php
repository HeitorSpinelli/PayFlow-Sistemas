<?php

namespace App\Models;

use App\Models\Concerns\Auditavel;
use Illuminate\Database\Eloquent\Model;

/**
 * Seguradora parceira — cards da tela Seguradoras e select de seguradora dos
 * modais de apólice.
 */
class Seguradora extends Model
{
    use Auditavel;

    // Seguradoras parceiras, como Porto Seguro, Bradesco Seguros, SulAmérica, etc.
    protected $table = 'seguradoras';

    protected $fillable = [
        'nome_fantasia',
        'razao_social',
        'cnpj',
        'contato_nome',
        'email_suporte',
    ];

    /**
     * Ramos oferecidos pela seguradora (listados no card e no modal de perfil).
     */
    public function ramos()
    {

        return $this->hasMany(Ramo::class, 'seguradora_id');
    }

    /* Log de auditoria (trait Auditavel) */

    public function auditoriaModulo(): string
    {
        return 'Seguradora';
    }

    public function auditoriaDescricao(): string
    {
        return (string) $this->nome_fantasia;
    }
}
