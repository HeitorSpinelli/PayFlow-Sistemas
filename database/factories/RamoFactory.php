<?php

namespace Database\Factories;

use App\Models\Ramo;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Ramo>
 */
class RamoFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'nome_ramo' => $this->faker->word(),
            'seguradora_id' => $this->faker->numberBetween(1, 86),
        ];
    }
}