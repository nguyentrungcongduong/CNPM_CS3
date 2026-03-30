<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Warehouse;

class WarehouseSeeder extends Seeder
{
    public function run(): void
    {
        $warehouses = [
            [
                'code' => 'KITCHEN-01',
                'name' => 'Bếp Trung Tâm Sài Gòn',
                'type' => 'KITCHEN',
                'address' => '123 Nguyễn Văn A, Quận 1, TP.HCM',
                'status' => 'ACTIVE',
            ],
            [
                'code' => 'KITCHEN-02',
                'name' => 'Bếp Trung Tâm Hà Nội',
                'type' => 'KITCHEN',
                'address' => '456 Trần Hưng Đạo, Hoàn Kiếm, Hà Nội',
                'status' => 'ACTIVE',
            ],
            [
                'code' => 'KITCHEN-03',
                'name' => 'Bếp Trung Tâm Đà Nẵng',
                'type' => 'KITCHEN',
                'address' => '789 Nguyễn Văn Linh, Hải Châu, Đà Nẵng',
                'status' => 'ACTIVE',
            ],
            [
                'code' => 'KITCHEN-04',
                'name' => 'Bếp Trung Tâm Cần Thơ',
                'type' => 'KITCHEN',
                'address' => '321 Nguyễn Văn Cừ, Ninh Kiều, Cần Thơ',
                'status' => 'ACTIVE',
            ],
        ];

        $now = now();

        foreach ($warehouses as $data) {
            Warehouse::updateOrCreate(
                ['code' => $data['code']],
                [
                    'name' => $data['name'],
                    'type' => $data['type'],
                    'address' => $data['address'],
                    'status' => $data['status'],
                    'created_at' => $now,
                    'updated_at' => $now,
                ]
            );
        }
    }
}
