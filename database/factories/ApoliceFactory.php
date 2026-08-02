<?php

namespace Database\Factories;

use App\Models\Apolice;
use App\Models\Segurado;
use App\Models\Seguradora;
use App\Models\Ramo;
use Illuminate\Database\Eloquent\Factories\Factory;

class ApoliceFactory extends Factory
{
    protected $model = Apolice::class;

    public function definition(): array
    {
        return [
            'numero_apolice'      => $this->faker->unique()->numerify('##########'),
            
            'cliente_id'          => Segurado::inRandomOrder()->value('id'),
            'seguradora_id'       => Seguradora::inRandomOrder()->value('id'),
            'ramo_id'             => Ramo::inRandomOrder()->value('id'),

            'valor_premio_total'  => $this->faker->randomFloat(2, 1000, 10000),
            'valor_cobertura'     => $this->faker->randomFloat(2, 5000, 50000),
            'quantidade_parcelas' => $this->faker->numberBetween(1, 12),
            'forma_pagamento'     => $this->faker->randomElement(['Boleto', 'Cartão de Crédito', 'Débito em Conta']),
            'inicio_vigencia'     => $this->faker->dateTimeBetween('-1 years', 'now'),
            'fim_vigencia'        => $this->faker->dateTimeBetween('now', '+1 years'),
            'status'              => $this->faker->randomElement(['Ativa', 'Cancelada', 'Pendente']),
            'observacoes'         => $this->faker->sentence(),
        ];
    }
}