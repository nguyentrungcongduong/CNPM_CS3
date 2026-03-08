<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class StoreSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        \App\Models\Store::insert([
            ['code' => 'STORE001', 'name' => 'Store Quận 1', 'address' => '123 ABC', 'phone' => '0123456789', 'created_at' => now(), 'updated_at' => now()],
        ]);
    }
}
