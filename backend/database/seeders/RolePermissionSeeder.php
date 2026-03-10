<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Role;
use App\Models\Permission;

class RolePermissionSeeder extends Seeder
{
    public function run(): void
    {
        $admin = Role::where('code', 'ADMIN')->first();
        $manager = Role::where('code', 'MANAGER')->first();
        $storeStaff = Role::where('code', 'STORE_STAFF')->first();
        $kitchenStaff = Role::where('code', 'CENTRAL_KITCHEN_STAFF')->first();
        $supplyCoordinator = Role::where('code', 'SUPPLY_COORDINATOR')->first();

        $allPermissions = Permission::pluck('id')->toArray();

        if ($admin) {
            $admin->permissions()->sync($allPermissions);
        }

        if ($manager) {
            $managerPermissionIds = Permission::whereIn('code', [
                'VIEW_DASHBOARD',
                'MANAGE_ITEMS',
                'MANAGE_STORES',
                'MANAGE_INVENTORY',
                'MANAGE_ORDERS',
                'VIEW_REPORTS',
            ])->pluck('id')->toArray();

            $manager->permissions()->sync($managerPermissionIds);
        }

        if ($storeStaff) {
            $storePermissionIds = Permission::whereIn('code', [
                'MANAGE_ORDERS',
                'MANAGE_INVENTORY',
            ])->pluck('id')->toArray();

            $storeStaff->permissions()->sync($storePermissionIds);
        }

        if ($kitchenStaff) {
            $kitchenPermissionIds = Permission::whereIn('code', [
                'MANAGE_INVENTORY',
                'MANAGE_ORDERS',
            ])->pluck('id')->toArray();

            $kitchenStaff->permissions()->sync($kitchenPermissionIds);
        }

        if ($supplyCoordinator) {
            $supplyPermissionIds = Permission::whereIn('code', [
                'MANAGE_ORDERS',
                'MANAGE_INVENTORY',
                'VIEW_REPORTS',
            ])->pluck('id')->toArray();

            $supplyCoordinator->permissions()->sync($supplyPermissionIds);
        }
    }
}
