<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Crear el usuario Administrador
        User::firstOrCreate(['email' => 'admin@tienda.com'], [
            'name' => 'Admin Tienda',
            'password' => Hash::make('password123'),
            'role' => 'admin',
        ]);
    }
}
