<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Role;
use App\Models\Store;
use App\Models\Warehouse;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        $adminRole = Role::where('code', 'ADMIN')->first();
        $managerRole = Role::where('code', 'MANAGER')->first();
        $kitchenRole = Role::where('code', 'KITCHEN_STAFF')->first();
        $storeStaffRole = Role::where('code', 'STORE_STAFF')->first();

        $stores = Store::orderBy('id')->get();
        $primaryStore = $stores->get(0);
        $secondStore = $stores->get(1) ?? $primaryStore;
        $thirdStore = $stores->get(2) ?? $primaryStore;

        $warehouse = Warehouse::orderBy('id')->first();

        $users = [
            // Admin
            [
                'full_name' => 'Admin System',
                'email' => 'admin@example.com',
                'phone' => '0900000001',
                'username' => 'admin',
                'password' => '123456',
                'role' => $adminRole,
                'store' => null,
                'warehouse' => null,
            ],

            // Store managers
            [
                'full_name' => 'Quản lý Store 1',
                'email' => 'manager1@example.com',
                'phone' => '0900000002',
                'username' => 'manager1',
                'password' => '123456',
                'role' => $managerRole,
                'store' => $primaryStore,
                'warehouse' => null,
            ],
            [
                'full_name' => 'Quản lý Store 2',
                'email' => 'manager2@example.com',
                'phone' => '0900000003',
                'username' => 'manager2',
                'password' => '123456',
                'role' => $managerRole,
                'store' => $secondStore,
                'warehouse' => null,
            ],
            [
                'full_name' => 'Quản lý Store 3',
                'email' => 'manager3@example.com',
                'phone' => '0900000004',
                'username' => 'manager3',
                'password' => '123456',
                'role' => $managerRole,
                'store' => $thirdStore,
                'warehouse' => null,
            ],

            // Kitchen staff
            [
                'full_name' => 'Nhân viên bếp 1',
                'email' => 'kitchen1@example.com',
                'phone' => '0900000005',
                'username' => 'kitchen1',
                'password' => '123456',
                'role' => $kitchenRole,
                'store' => null,
                'warehouse' => $warehouse,
            ],
            [
                'full_name' => 'Nhân viên bếp 2',
                'email' => 'kitchen2@example.com',
                'phone' => '0900000006',
                'username' => 'kitchen2',
                'password' => '123456',
                'role' => $kitchenRole,
                'store' => null,
                'warehouse' => $warehouse,
            ],

            // Store staff (optional, useful for testing)
            [
                'full_name' => 'Nhân viên cửa hàng 1',
                'email' => 'storestaff1@example.com',
                'phone' => '0900000007',
                'username' => 'storestaff1',
                'password' => '123456',
                'role' => $storeStaffRole,
                'store' => $primaryStore,
                'warehouse' => null,
            ],
            [
                'full_name' => 'Nhân viên cửa hàng 2',
                'email' => 'storestaff2@example.com',
                'phone' => '0900000008',
                'username' => 'storestaff2',
                'password' => '123456',
                'role' => $storeStaffRole,
                'store' => $secondStore,
                'warehouse' => null,
            ],
        ];

        foreach ($users as $data) {
            if (!$data['role']) {
                continue;
            }

            User::updateOrCreate(
                ['email' => $data['email']],
                [
                    'role_id' => $data['role']->id,
                    'store_id' => $data['store']?->id,
                    'warehouse_id' => $data['warehouse']?->id,
                    'full_name' => $data['full_name'],
                    'phone' => $data['phone'],
                    'username' => $data['username'],
                    'password' => Hash::make($data['password']),
                    'status' => 'ACTIVE',
                ]
            );
        }
    }
}
