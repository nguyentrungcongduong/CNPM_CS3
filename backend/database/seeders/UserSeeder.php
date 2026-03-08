<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        User::create([
            'role_id' => 1,            // đảm bảo RoleSeeder đã tạo role id=1 (ADMIN)
            'store_id' => null,
            'warehouse_id' => null,
            'full_name' => 'Admin User',
            'email' => 'admin@example.com',
            'phone' => '0900000001',
            'username' => 'admin',
            'password' => Hash::make('123456'),
            'status' => 'ACTIVE',
        ]);
    }
}
