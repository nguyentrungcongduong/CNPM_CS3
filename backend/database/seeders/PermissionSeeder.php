<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Permission;

class PermissionSeeder extends Seeder
{
    public function run(): void
    {
        $permissions = [
            ['code' => 'VIEW_DASHBOARD', 'name' => 'View dashboard'],
            ['code' => 'MANAGE_USERS', 'name' => 'Manage users'],
            ['code' => 'MANAGE_ITEMS', 'name' => 'Manage items'],
            ['code' => 'MANAGE_STORES', 'name' => 'Manage stores'],
            ['code' => 'MANAGE_INVENTORY', 'name' => 'Manage inventory'],
            ['code' => 'MANAGE_ORDERS', 'name' => 'Manage orders'],
            ['code' => 'VIEW_REPORTS', 'name' => 'View reports'],
        ];

        foreach ($permissions as $permission) {
            Permission::updateOrCreate(
                ['code' => $permission['code']],
                $permission
            );
        }
    }
}