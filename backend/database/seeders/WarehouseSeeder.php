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
                'code' => 'KITCHEN-BD',
                'name' => 'Bếp Trung Tâm Bình Dương',
                'type' => 'KITCHEN',
                'address' => 'Khu VSIP I, Thuận An, Bình Dương',
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
