<?php

namespace Database\Seeders;

use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // User::factory(10)->create();

        // Usuário de teste com senha padrão do factory — só faz sentido em
        // ambiente local. Rodar `db:seed` sem essa trava contra um banco de
        // produção criaria uma conta com credencial previsível.
        if (! app()->environment('local')) {
            return;
        }

        User::factory()->create([
            'name' => 'Test User',
            'email' => 'test@example.com',
        ]);
    }
}
