<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use App\Models\User;

class AdminUserSeeder extends Seeder
{
    public function run(): void
    {
        User::updateOrCreate(
            ['email' => env('ADMIN_EMAIL', 'trafico@maulec.com')],
            [
                'name' => env('ADMIN_NAME', 'Admin'),
                'password' => Hash::make(env('ADMIN_PASSWORD', 'admin123')),
            ]
        );
        User::updateOrCreate(
            ['email' => env('ADMIN_EMAIL', 'carlosg@maulec.com.mx')],
            [
                'name' => env('ADMIN_NAME', 'Hernan'),
                'password' => Hash::make(env('ADMIN_PASSWORD', 'TraficoMau2025')),
            ]
        );
    }
}
