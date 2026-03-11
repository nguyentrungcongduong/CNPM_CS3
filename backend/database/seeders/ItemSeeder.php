<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Item;

class ItemSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $items = [
            // Ingredients
            [
                'code' => 'ING-RICE-JASMINE',
                'name' => 'Gạo Jasmine',
                'type' => 'INGREDIENT',
                'unit' => 'kg',
                'default_price' => 22000,
                'shelf_life_days' => 180,
                'min_stock' => 50,
                'description' => 'Gạo thơm Jasmine dùng cho cơm trắng.',
                'status' => 'ACTIVE',
            ],
            [
                'code' => 'ING-RICE-STICKY',
                'name' => 'Gạo nếp',
                'type' => 'INGREDIENT',
                'unit' => 'kg',
                'default_price' => 26000,
                'shelf_life_days' => 180,
                'min_stock' => 30,
                'description' => 'Gạo nếp dùng cho xôi, bánh.',
                'status' => 'ACTIVE',
            ],
            [
                'code' => 'ING-CHK-BREAST',
                'name' => 'Ức gà fillet',
                'type' => 'INGREDIENT',
                'unit' => 'kg',
                'default_price' => 85000,
                'shelf_life_days' => 5,
                'min_stock' => 20,
                'description' => 'Ức gà bỏ da, đông lạnh.',
                'status' => 'ACTIVE',
            ],
            [
                'code' => 'ING-PORK-BELLY',
                'name' => 'Ba rọi heo',
                'type' => 'INGREDIENT',
                'unit' => 'kg',
                'default_price' => 120000,
                'shelf_life_days' => 5,
                'min_stock' => 15,
                'description' => 'Ba rọi heo đông lạnh, cắt lát.',
                'status' => 'ACTIVE',
            ],
            [
                'code' => 'ING-EGG-CHICKEN',
                'name' => 'Trứng gà',
                'type' => 'INGREDIENT',
                'unit' => 'piece',
                'default_price' => 3500,
                'shelf_life_days' => 14,
                'min_stock' => 120,
                'description' => 'Trứng gà tươi, quy cách vỉ 10 quả.',
                'status' => 'ACTIVE',
            ],

            // Vegetables
            [
                'code' => 'VEG-ONION',
                'name' => 'Hành tây',
                'type' => 'VEGETABLE',
                'unit' => 'kg',
                'default_price' => 28000,
                'shelf_life_days' => 30,
                'min_stock' => 10,
                'description' => 'Hành tây củ, dùng cho xào, nấu.',
                'status' => 'ACTIVE',
            ],
            [
                'code' => 'VEG-GARLIC',
                'name' => 'Tỏi khô',
                'type' => 'VEGETABLE',
                'unit' => 'kg',
                'default_price' => 60000,
                'shelf_life_days' => 60,
                'min_stock' => 8,
                'description' => 'Tỏi khô bóc vỏ một phần.',
                'status' => 'ACTIVE',
            ],
            [
                'code' => 'VEG-TOMATO',
                'name' => 'Cà chua',
                'type' => 'VEGETABLE',
                'unit' => 'kg',
                'default_price' => 32000,
                'shelf_life_days' => 5,
                'min_stock' => 12,
                'description' => 'Cà chua chín vừa, dùng cho salad và sốt.',
                'status' => 'ACTIVE',
            ],
            [
                'code' => 'VEG-LETTUCE',
                'name' => 'Xà lách Romaine',
                'type' => 'VEGETABLE',
                'unit' => 'kg',
                'default_price' => 45000,
                'shelf_life_days' => 3,
                'min_stock' => 6,
                'description' => 'Xà lách tươi dùng cho salad.',
                'status' => 'ACTIVE',
            ],
            [
                'code' => 'VEG-CUCUMBER',
                'name' => 'Dưa leo',
                'type' => 'VEGETABLE',
                'unit' => 'kg',
                'default_price' => 25000,
                'shelf_life_days' => 5,
                'min_stock' => 10,
                'description' => 'Dưa leo tươi, dùng ăn kèm.',
                'status' => 'ACTIVE',
            ],

            // Spices
            [
                'code' => 'SPC-SALT',
                'name' => 'Muối tinh',
                'type' => 'SPICE',
                'unit' => 'kg',
                'default_price' => 9000,
                'shelf_life_days' => 365,
                'min_stock' => 5,
                'description' => 'Muối tinh đóng bao 1kg.',
                'status' => 'ACTIVE',
            ],
            [
                'code' => 'SPC-SUGAR',
                'name' => 'Đường cát trắng',
                'type' => 'SPICE',
                'unit' => 'kg',
                'default_price' => 21000,
                'shelf_life_days' => 365,
                'min_stock' => 8,
                'description' => 'Đường cát trắng đóng bao 1kg.',
                'status' => 'ACTIVE',
            ],
            [
                'code' => 'SPC-PEPPER-BLACK',
                'name' => 'Tiêu đen xay',
                'type' => 'SPICE',
                'unit' => 'g',
                'default_price' => 120000,
                'shelf_life_days' => 365,
                'min_stock' => 500,
                'description' => 'Tiêu đen xay mịn, gói 500g.',
                'status' => 'ACTIVE',
            ],
            [
                'code' => 'SPC-SOY-SAUCE',
                'name' => 'Nước tương',
                'type' => 'SPICE',
                'unit' => 'bottle',
                'default_price' => 15000,
                'shelf_life_days' => 365,
                'min_stock' => 40,
                'description' => 'Nước tương chai 500ml.',
                'status' => 'ACTIVE',
            ],
            [
                'code' => 'SPC-CHILI-SAUCE',
                'name' => 'Tương ớt',
                'type' => 'SPICE',
                'unit' => 'bottle',
                'default_price' => 18000,
                'shelf_life_days' => 365,
                'min_stock' => 40,
                'description' => 'Tương ớt chai 500ml.',
                'status' => 'ACTIVE',
            ],

            // Liquids & others
            [
                'code' => 'LIQ-COOKING-OIL',
                'name' => 'Dầu ăn tinh luyện',
                'type' => 'LIQUID',
                'unit' => 'bottle',
                'default_price' => 45000,
                'shelf_life_days' => 365,
                'min_stock' => 30,
                'description' => 'Dầu ăn chai 1L.',
                'status' => 'ACTIVE',
            ],
            [
                'code' => 'LIQ-FISH-SAUCE',
                'name' => 'Nước mắm',
                'type' => 'LIQUID',
                'unit' => 'bottle',
                'default_price' => 38000,
                'shelf_life_days' => 365,
                'min_stock' => 25,
                'description' => 'Nước mắm chai 750ml.',
                'status' => 'ACTIVE',
            ],
            [
                'code' => 'LIQ-MAYO',
                'name' => 'Sốt mayonnaise',
                'type' => 'LIQUID',
                'unit' => 'pack',
                'default_price' => 65000,
                'shelf_life_days' => 180,
                'min_stock' => 15,
                'description' => 'Sốt mayonnaise túi 1kg.',
                'status' => 'ACTIVE',
            ],
            [
                'code' => 'ING-FLOUR-WHEAT',
                'name' => 'Bột mì',
                'type' => 'INGREDIENT',
                'unit' => 'kg',
                'default_price' => 28000,
                'shelf_life_days' => 365,
                'min_stock' => 20,
                'description' => 'Bột mì đa dụng bao 1kg.',
                'status' => 'ACTIVE',
            ],
            [
                'code' => 'ING-BUTTER-UNSALTED',
                'name' => 'Bơ lạt',
                'type' => 'INGREDIENT',
                'unit' => 'pack',
                'default_price' => 95000,
                'shelf_life_days' => 90,
                'min_stock' => 10,
                'description' => 'Bơ lạt 454g, bảo quản lạnh.',
                'status' => 'ACTIVE',
            ],
            [
                'code' => 'ING-MILK-FRESH',
                'name' => 'Sữa tươi không đường',
                'type' => 'INGREDIENT',
                'unit' => 'pack',
                'default_price' => 32000,
                'shelf_life_days' => 10,
                'min_stock' => 24,
                'description' => 'Sữa tươi hộp giấy 1L.',
                'status' => 'ACTIVE',
            ],
            [
                'code' => 'PACK-TAKEAWAY-BOX',
                'name' => 'Hộp mang đi',
                'type' => 'PACKAGING',
                'unit' => 'pack',
                'default_price' => 60000,
                'shelf_life_days' => 365,
                'min_stock' => 10,
                'description' => 'Hộp xốp mang đi, gói 100 cái.',
                'status' => 'ACTIVE',
            ],
            [
                'code' => 'PACK-PLASTIC-BAG',
                'name' => 'Túi nylon',
                'type' => 'PACKAGING',
                'unit' => 'pack',
                'default_price' => 30000,
                'shelf_life_days' => 365,
                'min_stock' => 15,
                'description' => 'Túi nylon size trung bình, gói 1kg.',
                'status' => 'ACTIVE',
            ],
            [
                'code' => 'DRY-NOODLE',
                'name' => 'Mì khô',
                'type' => 'INGREDIENT',
                'unit' => 'pack',
                'default_price' => 38000,
                'shelf_life_days' => 365,
                'min_stock' => 20,
                'description' => 'Mì sợi khô, gói 1kg.',
                'status' => 'ACTIVE',
            ],
            [
                'code' => 'DRY-SEAWEED',
                'name' => 'Rong biển khô',
                'type' => 'INGREDIENT',
                'unit' => 'pack',
                'default_price' => 52000,
                'shelf_life_days' => 365,
                'min_stock' => 10,
                'description' => 'Rong biển khô gói 200g.',
                'status' => 'ACTIVE',
            ],
        ];

        $now = now();

        foreach ($items as &$item) {
            $item['created_at'] = $now;
            $item['updated_at'] = $now;
        }
        unset($item);

        // Idempotent seeding to avoid duplicate codes when re-running
        foreach ($items as $data) {
            Item::updateOrCreate(
                ['code' => $data['code']],
                $data
            );
        }
    }
}
