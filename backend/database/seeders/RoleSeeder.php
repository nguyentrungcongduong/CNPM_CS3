<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class RoleSeeder extends Seeder
{
    public function run(): void
    {
<<<<<<< HEAD
        DB::table('roles')->insert([
            [
                'id' => 1,
                'name' => 'Admin',
                'code' => 'ADMIN',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id' => 2,
                'name' => 'Manager',
                'code' => 'MANAGER',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id' => 3,
                'name' => 'Store Staff',
                'code' => 'STORE_STAFF',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id' => 4,
                'name' => 'Kitchen Staff',
                'code' => 'KITCHEN_STAFF',
                'created_at' => now(),
                'updated_at' => now(),
            ],
=======
        \App\Models\Role::insert([
            ['code' => 'ADMIN', 'name' => 'Quản trị viên', 'created_at' => now(), 'updated_at' => now()],
            ['code' => 'MANAGER', 'name' => 'Quản lý', 'created_at' => now(), 'updated_at' => now()],
            ['code' => 'SUPPLY_COORDINATOR', 'name' => 'Điều phối cung ứng', 'created_at' => now(), 'updated_at' => now()],
            ['code' => 'KITCHEN_STAFF', 'name' => 'Nhân viên bếp', 'created_at' => now(), 'updated_at' => now()],
            ['code' => 'STORE_STAFF', 'name' => 'Nhân viên cửa hàng', 'created_at' => now(), 'updated_at' => now()],
>>>>>>> 326dceb641eebeb4e6bf2714c6d3aa968e9693bd
        ]);
    }
}