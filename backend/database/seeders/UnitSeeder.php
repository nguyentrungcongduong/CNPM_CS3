<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Unit;

class UnitSeeder extends Seeder
{
    public function run(): void
    {
        $units = [
            // Weight
            ['name' => 'Kilogram', 'symbol' => 'kg', 'type' => 'weight', 'is_default' => true],
            ['name' => 'Gram', 'symbol' => 'g', 'type' => 'weight', 'is_default' => false],

            // Volume
            ['name' => 'Lít', 'symbol' => 'l', 'type' => 'volume', 'is_default' => true],
            ['name' => 'Mililít', 'symbol' => 'ml', 'type' => 'volume', 'is_default' => false],
            ['name' => 'Chai/Bottle', 'symbol' => 'bottle', 'type' => 'volume', 'is_default' => false],
            ['name' => 'Lon/Can', 'symbol' => 'can', 'type' => 'volume', 'is_default' => false],

            // Count
            ['name' => 'Cái/Piece', 'symbol' => 'piece', 'type' => 'count', 'is_default' => true],
            ['name' => 'Hộp/Box', 'symbol' => 'box', 'type' => 'count', 'is_default' => false],
            ['name' => 'Gói/Pack', 'symbol' => 'pack', 'type' => 'count', 'is_default' => false],
        ];

        foreach ($units as $u) {
            Unit::updateOrCreate(
                ['symbol' => $u['symbol']],
                $u
            );
        }
    }
}
