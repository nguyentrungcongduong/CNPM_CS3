<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Recipe;
use App\Models\RecipeItem;
use App\Models\Item;

class RecipeSeeder extends Seeder
{
    public function run(): void
    {
        // Lấy các items đã có
        $gaFillet = Item::where('code', 'ING-CHK-BREAST')->first();
        $trungGa = Item::where('code', 'ING-EGG-CHICKEN')->first();
        $botMi = Item::where('code', 'ING-FLOUR-WHEAT')->first();
        $boLat = Item::where('code', 'ING-BUTTER-UNSALTED')->first();
        $suaTuoi = Item::where('code', 'ING-MILK-FRESH')->first();
        $thitHeo = Item::where('code', 'ING-PORK-BELLY')->first();
        $dauAn = Item::where('code', 'LIQ-COOKING-OIL')->first();
        $hanhTay = Item::where('code', 'VEG-ONION')->first();
        $toi = Item::where('code', 'VEG-GARLIC')->first();
        $caChua = Item::where('code', 'VEG-TOMATO')->first();
        $xalach = Item::where('code', 'VEG-LETTUCE')->first();
        $duaLeo = Item::where('code', 'VEG-CUCUMBER')->first();
        $muoi = Item::where('code', 'SPC-SALT')->first();
        $duong = Item::where('code', 'SPC-SUGAR')->first();
        $tieuDen = Item::where('code', 'SPC-PEPPER-BLACK')->first();
        $nuocTuong = Item::where('code', 'SPC-SOY-SAUCE')->first();
        $nuocMam = Item::where('code', 'LIQ-FISH-SAUCE')->first();
        $sotMayo = Item::where('code', 'LIQ-MAYO')->first();
        $miKho = Item::where('code', 'DRY-NOODLE')->first();
        $gaoJasmine = Item::where('code', 'ING-RICE-JASMINE')->first();

        $recipes = [
            [
                'code' => 'RECIPE-001',
                'name' => 'Cơm gà xối mỡ',
                'description' => 'Cơm gà truyền thống với gà chiên giòn, cơm Jasmine thơm ngon',
                'items' => [
                    ['item' => $gaFillet, 'qty' => 0.3], // 300g ức gà
                    ['item' => $gaoJasmine, 'qty' => 0.2], // 200g gạo
                    ['item' => $dauAn, 'qty' => 0.05], // 50ml dầu ăn
                    ['item' => $toi, 'qty' => 0.01], // 10g tỏi
                    ['item' => $muoi, 'qty' => 0.005], // 5g muối
                    ['item' => $tieuDen, 'qty' => 0.002], // 2g tiêu
                ]
            ],
            [
                'code' => 'RECIPE-002',
                'name' => 'Phở bò tái',
                'description' => 'Phở bò truyền thống với nước dùng đậm đà, thịt bò tái mềm',
                'items' => [
                    ['item' => $thitHeo, 'qty' => 0.15], // 150g thịt (dùng thịt heo thay thịt bò)
                    ['item' => $miKho, 'qty' => 0.15], // 150g bánh phở
                    ['item' => $hanhTay, 'qty' => 0.05], // 50g hành tây
                    ['item' => $nuocMam, 'qty' => 0.02], // 20ml nước mắm
                    ['item' => $muoi, 'qty' => 0.003], // 3g muối
                    ['item' => $duong, 'qty' => 0.005], // 5g đường
                ]
            ],
            [
                'code' => 'RECIPE-003',
                'name' => 'Bún chả Hà Nội',
                'description' => 'Bún chả đặc trưng với thịt nướng thơm lừng, nước mắm chua ngọt',
                'items' => [
                    ['item' => $thitHeo, 'qty' => 0.2], // 200g thịt ba rọi
                    ['item' => $hanhTay, 'qty' => 0.03], // 30g hành tây
                    ['item' => $toi, 'qty' => 0.01], // 10g tỏi
                    ['item' => $nuocMam, 'qty' => 0.03], // 30ml nước mắm
                    ['item' => $duong, 'qty' => 0.01], // 10g đường
                    ['item' => $duaLeo, 'qty' => 0.05], // 50g dưa leo
                ]
            ],
            [
                'code' => 'RECIPE-004',
                'name' => 'Gà rán giòn KFC style',
                'description' => 'Gà rán giòn rụm với lớp vỏ ngoài vàng ruộm, thịt bên trong mềm juicy',
                'items' => [
                    ['item' => $gaFillet, 'qty' => 0.5], // 500g ức gà
                    ['item' => $botMi, 'qty' => 0.1], // 100g bột mì
                    ['item' => $trungGa, 'qty' => 2], // 2 quả trứng
                    ['item' => $dauAn, 'qty' => 0.3], // 300ml dầu ăn
                    ['item' => $muoi, 'qty' => 0.01], // 10g muối
                    ['item' => $tieuDen, 'qty' => 0.005], // 5g tiêu
                ]
            ],
            [
                'code' => 'RECIPE-005',
                'name' => 'Bánh mì thịt nguội',
                'description' => 'Bánh mì Việt Nam với thịt nguội, pate, rau củ tươi ngon',
                'items' => [
                    ['item' => $botMi, 'qty' => 0.15], // 150g bột mì làm vỏ bánh
                    ['item' => $thitHeo, 'qty' => 0.1], // 100g thịt
                    ['item' => $caChua, 'qty' => 0.03], // 30g cà chua
                    ['item' => $duaLeo, 'qty' => 0.03], // 30g dưa leo
                    ['item' => $xalach, 'qty' => 0.02], // 20g xà lách
                    ['item' => $sotMayo, 'qty' => 0.02], // 20g sốt mayo
                ]
            ],
            [
                'code' => 'RECIPE-006',
                'name' => 'Mì xào hải sản',
                'description' => 'Mì xào giòn với tôm, mực tươi và rau củ giòn ngon',
                'items' => [
                    ['item' => $miKho, 'qty' => 0.2], // 200g mì khô
                    ['item' => $caChua, 'qty' => 0.05], // 50g cà chua
                    ['item' => $hanhTay, 'qty' => 0.05], // 50g hành tây
                    ['item' => $toi, 'qty' => 0.01], // 10g tỏi
                    ['item' => $dauAn, 'qty' => 0.03], // 30ml dầu ăn
                    ['item' => $nuocTuong, 'qty' => 0.02], // 20ml nước tương
                ]
            ],
            [
                'code' => 'RECIPE-007',
                'name' => 'Bánh flan caramel',
                'description' => 'Bánh flan mềm mịn, béo ngậy với lớp caramel đắng nhẹ',
                'items' => [
                    ['item' => $trungGa, 'qty' => 4], // 4 quả trứng
                    ['item' => $suaTuoi, 'qty' => 0.5], // 500ml sữa tươi
                    ['item' => $duong, 'qty' => 0.1], // 100g đường
                    ['item' => $nuocTuong, 'qty' => 0.005], // 5ml nước tương (làm caramel)
                ]
            ],
            [
                'code' => 'RECIPE-008',
                'name' => 'Bánh pancake sáng',
                'description' => 'Bánh pancake xốp mịn cho bữa sáng nhanh gọn, ăn kèm mật ong hoặc syrup',
                'items' => [
                    ['item' => $botMi, 'qty' => 0.2], // 200g bột mì
                    ['item' => $trungGa, 'qty' => 2], // 2 quả trứng
                    ['item' => $suaTuoi, 'qty' => 0.25], // 250ml sữa tươi
                    ['item' => $boLat, 'qty' => 0.05], // 50g bơ lạt
                    ['item' => $duong, 'qty' => 0.03], // 30g đường
                    ['item' => $muoi, 'qty' => 0.002], // 2g muối
                ]
            ],
        ];

        foreach ($recipes as $recipeData) {
            $recipe = Recipe::updateOrCreate(
                ['code' => $recipeData['code']],
                [
                    'name' => $recipeData['name'],
                    'description' => $recipeData['description'],
                    'status' => 'ACTIVE',
                ]
            );

            // Xóa recipe items cũ nếu có
            RecipeItem::where('recipe_id', $recipe->id)->delete();

            // Tạo recipe items
            foreach ($recipeData['items'] as $itemData) {
                if ($itemData['item']) {
                    RecipeItem::create([
                        'recipe_id' => $recipe->id,
                        'item_id' => $itemData['item']->id,
                        'quantity' => $itemData['qty'],
                    ]);
                }
            }
        }
    }
}
