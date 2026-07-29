<?php

namespace Database\Factories;

use App\Models\Seguradora;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Seguradora>
 */
class SeguradoraFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'nome_fantasia' => $this->faker->company(),
            'razao_social' => $this->faker->company(),
            'cnpj' => $this->faker->unique()->numerify('##.###.###/####-##'),
            'contato_nome' => $this->faker->name(),
            'email_suporte' => $this->faker->unique()->safeEmail(),
        ];
    }
}