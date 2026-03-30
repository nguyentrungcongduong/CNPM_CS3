<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Store;

class StoreSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $stores = [
            [
                'code' => 'STORE-A',
                'name' => 'Store A - Quận 1',
                'address' => '123 Lê Lợi, Quận 1, TP.HCM',
                'phone' => '02812345678',
                'manager_name' => 'Nguyễn Văn A',
                'status' => 'ACTIVE',
            ],
            [
                'code' => 'STORE-B',
                'name' => 'Store B - Quận 3',
                'address' => '45 Cách Mạng Tháng 8, Quận 3, TP.HCM',
                'phone' => '02823456789',
                'manager_name' => 'Trần Thị B',
                'status' => 'ACTIVE',
            ],
            [
                'code' => 'STORE-C',
                'name' => 'Store C - Thủ Đức',
                'address' => '88 Phạm Văn Đồng, TP.Thủ Đức',
                'phone' => '02834567890',
                'manager_name' => 'Lê Văn C',
                'status' => 'ACTIVE',
            ],
        ];

        $now = now();

        foreach ($stores as $data) {
            Store::updateOrCreate(
                ['code' => $data['code']],
                [
                    'name' => $data['name'],
                    'address' => $data['address'],
                    'phone' => $data['phone'],
                    'manager_name' => $data['manager_name'],
                    'status' => $data['status'],
                    'created_at' => $now,
                    'updated_at' => $now,
                ]
            );
        }
    }
}
