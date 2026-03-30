<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Role;

class RoleSeeder extends Seeder
{
    public function run(): void
    {
        $roles = [
            ['code' => 'ADMIN', 'name' => 'Quản trị viên'],
            ['code' => 'MANAGER', 'name' => 'Quản lý'],
            ['code' => 'SUPPLY_COORDINATOR', 'name' => 'Điều phối cung ứng'],
            ['code' => 'KITCHEN_STAFF', 'name' => 'Nhân viên bếp'],
            ['code' => 'STORE_STAFF', 'name' => 'Nhân viên cửa hàng'],
        ];

        foreach ($roles as $roleData) {
            Role::updateOrCreate(
                ['code' => $roleData['code']],
                [
                    'name' => $roleData['name'],
                    'created_at' => now(),
                    'updated_at' => now(),
                ]
            );
        }
    }
}
