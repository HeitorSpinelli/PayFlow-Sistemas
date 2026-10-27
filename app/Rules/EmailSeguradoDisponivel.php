<?php

namespace App\Rules;

use App\Models\Segurado;
use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

/**
 * Impede que dois clientes tenham o mesmo e-mail (inclusive na lixeira).
 * Usado no cadastro (StoreSeguradoRequest, modal "Novo Cliente") e na edição
 * pelo painel do cliente (UpdateSeguradoRequest).
 */
class EmailSeguradoDisponivel implements ValidationRule
{
    /**
     * $ignorarId = o próprio cliente em edição, para não conflitar com ele mesmo.
     */
    public function __construct(private readonly ?int $ignorarId = null) {}

    /**
     * Mensagem diferente quando o e-mail é de um cliente excluído (restaurar na lixeira).
     */
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        $existente = Segurado::withTrashed()
            ->where('email', $value)
            ->when($this->ignorarId, fn ($query) => $query->where('id', '!=', $this->ignorarId))
            ->first();

        if (! $existente) {
            return;
        }

        if ($existente->trashed()) {
            $fail('Este e-mail já pertence a um cliente excluído. Restaure o cadastro na lista de clientes inativos em vez de reutilizar o e-mail.');

            return;
        }

        $fail('O e-mail informado já está em uso por outro cliente.');
    }
}
