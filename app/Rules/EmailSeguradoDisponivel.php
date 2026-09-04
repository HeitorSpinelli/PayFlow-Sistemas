<?php

namespace App\Rules;

use App\Models\Segurado;
use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

class EmailSeguradoDisponivel implements ValidationRule
{
    public function __construct(private readonly ?int $ignorarId = null) {}

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
