<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class DemoSeeder extends Seeder
{
    /**
     * Seed a clean, realistic demo dataset.
     */
    public function run(): void
    {
        /**
         * PostgreSQL không hỗ trợ FOREIGN_KEY_CHECKS như MySQL.
         * Dùng TRUNCATE ... CASCADE để xóa sạch dữ liệu demo và reset ID.
         */
        DB::statement('TRUNCATE TABLE
            inventory_transactions,
            inventory,
            batches,
            delivery_items,
            deliveries,
            order_items,
            orders,
            recipe_items,
            recipes,
            items,
            warehouses,
            stores,
            users
            RESTART IDENTITY CASCADE
        ');

        // Seed lại dữ liệu chuẩn cho demo
        $this->call([
            RoleSeeder::class,
            StoreSeeder::class,      // 3 store: Q1, Q3, Q7
            WarehouseSeeder::class,  // 1 bếp trung tâm Bình Dương
            ItemSeeder::class,       // 8-10 sản phẩm thực tế
            UnitSeeder::class,
            UserSeeder::class,       // Tài khoản đủ 5 role chính
            RecipeSeeder::class,
            OrderSeeder::class,
            BatchSeeder::class,
        ]);
    }
}
