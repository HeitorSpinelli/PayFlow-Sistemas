<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Segurado;
use App\Models\Apolices;
use App\Models\Seguradora;
use App\Models\Ramo;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Cria 8 usuários para o sistema
        User::factory(8)->create();

        // 2. Cria 2500 clientes/segurados
        Segurado::factory(100)->create();

        // 3. Cria as Seguradoras e Ramos primeiro (invertido para evitar erro de FK)
        Seguradora::factory(86)->create();
        Ramo::factory(5)->create();

        // 4. Cria 521 apólices vinculadas aos clientes e seguradoras já existentes
        Apolices::factory(521)->create();
    }
}