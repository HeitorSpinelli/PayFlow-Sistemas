<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Segurado;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Cria 8 usuários para o sistema
        User::factory(8)->create();

        // 2. Cria 650 clientes/segurados
        Segurado::factory(650)->create();
    }
}