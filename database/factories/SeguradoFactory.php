<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

class SeguradoFactory extends Factory
{
    public function definition(): array
    {
        return [
            'nome_completo'            => $this->faker->name(),
            'tipo_pessoa'              => $this->faker->randomElement(['PF', 'PJ']),
            'cpf_cnpj'                 => $this->faker->unique()->numerify('###########'),
            'data_nascimento_fundacao' => $this->faker->date(),
            'email'                    => $this->faker->unique()->safeEmail(),
            'telefone_fixo'            => $this->faker->phoneNumber(),
            'celular_whatsapp'         => $this->faker->phoneNumber(),
            'cidade'                   => $this->faker->city(),
            'estado'                   => $this->faker->stateAbbr(),
            'cep'                      => $this->faker->numerify('#####-###'),
        ];
    }
}