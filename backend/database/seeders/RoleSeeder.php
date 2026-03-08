<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class RoleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        \App\Models\Role::insert([
            ['code' => 'ADMIN', 'name' => 'Quản trị viên', 'created_at' => now(), 'updated_at' => now()],
            ['code' => 'MANAGER', 'name' => 'Quản lý', 'created_at' => now(), 'updated_at' => now()],
            ['code' => 'SUPPLY_COORDINATOR', 'name' => 'Điều phối cung ứng', 'created_at' => now(), 'updated_at' => now()],
            ['code' => 'KITCHEN_STAFF', 'name' => 'Nhân viên bếp', 'created_at' => now(), 'updated_at' => now()],
            ['code' => 'STORE_STAFF', 'name' => 'Nhân viên cửa hàng', 'created_at' => now(), 'updated_at' => now()],
        ]);
    }
}
