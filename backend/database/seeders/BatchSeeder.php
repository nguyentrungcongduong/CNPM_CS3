<?php

namespace Database\Seeders;

use App\Models\Batch;
use App\Models\Inventory;
use App\Models\InventoryTransaction;
use App\Models\Item;
use App\Models\Warehouse;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class BatchSeeder extends Seeder
{
    public function run(): void
    {
        // Đảm bảo có Bếp Trung Tâm
        $kitchen = Warehouse::where('type', 'KITCHEN')->first();
        if (!$kitchen) {
            $kitchen = Warehouse::create([
                'code' => 'KITCHEN-01',
                'name' => 'Bếp Trung Tâm Sài Gòn',
                'type' => 'KITCHEN',
                'address' => '123 Nguyễn Văn A, Quận 1, TP.HCM',
                'status' => 'ACTIVE'
            ]);
        }

        // Lấy các sản phẩm chính đã có trong ItemSeeder
        $items = [
            Item::where('code', 'ING-CHK-BREAST')->first(), // Ức gà fillet
            Item::where('code', 'ING-MILK-FRESH')->first(), // Sữa tươi không đường
            Item::where('code', 'ING-EGG-CHICKEN')->first(), // Trứng gà
            Item::where('code', 'ING-BUTTER-UNSALTED')->first(), // Bơ lạt
            Item::where('code', 'ING-FLOUR-WHEAT')->first(), // Bột mì
            Item::where('code', 'ING-PORK-BELLY')->first(), // Ba rọi heo
            Item::where('code', 'LIQ-COOKING-OIL')->first(), // Dầu ăn
        ];

        // Tạo 1 batch cố định để scan QR (batch này sẽ có mã cố định để dễ test)
        $demoItem = $items[0]; // Ức gà fillet
        $this->createFixedBatch($kitchen, $demoItem);

        // Tạo các batch khác cho các items
        foreach ($items as $index => $item) {
            if ($index === 0) continue; // Skip demo item đã tạo ở trên
            
            // Tạo 3 loại lô cho mỗi mặt hàng: Bình thường, Sắp hết hạn, Đã hết hạn
            
            // 1. Lô bình thường (Còn hạn dài)
            $this->createBatch($kitchen, $item, 100, now()->addMonths(6), 'ACTIVE');

            // 2. Lô sắp hết hạn (Trong vòng 5 ngày tới)
            $this->createBatch($kitchen, $item, 50, now()->addDays(5), 'ACTIVE');
        }
    }

    private function createFixedBatch($warehouse, $item)
    {
        // Batch cố định với mã dễ nhớ để test QR scan
        $batchCode = 'BAT-DEMO-001-TESTQR';
        
        // Xóa batch cũ nếu có để tránh trùng lặp
        Batch::where('batch_code', $batchCode)->delete();

        $batch = Batch::create([
            'batch_code' => $batchCode,
            'item_id' => $item->id,
            'warehouse_id' => $warehouse->id,
            'quantity' => 50,
            'initial_quantity' => 50,
            'mfg_date' => now()->subDays(10),
            'expiry_date' => now()->addDays(20),
            'status' => 'ACTIVE',
        ]);

        // Cập nhật tồn kho aggregate
        $inventory = Inventory::firstOrCreate(
            ['warehouse_id' => $warehouse->id, 'item_id' => $item->id],
            ['quantity_on_hand' => 0, 'quantity_reserved' => 0, 'quantity_available' => 0]
        );

        $oldVal = $inventory->quantity_on_hand;
        $inventory->quantity_on_hand += 50;
        $inventory->quantity_available += 50;
        $inventory->last_updated_at = now();
        $inventory->save();

        // Ghi transaction
        InventoryTransaction::create([
            'inventory_id' => $inventory->id,
            'warehouse_id' => $warehouse->id,
            'item_id' => $item->id,
            'batch_id' => $batch->id,
            'reference_type' => 'batch',
            'reference_id' => $batch->id,
            'type' => 'IN',
            'quantity' => 50,
            'quantity_before' => $oldVal,
            'quantity_after' => $inventory->quantity_on_hand,
            'note' => "Batch DEMO để test QR scan - {$item->name}",
        ]);
    }

    private function createBatch($warehouse, $item, $qty, $expiryDate, $status)
    {
        $batchCode = 'BAT-' . strtoupper(Str::random(8)) . '-' . date('ymd');

        $batch = Batch::create([
            'batch_code' => $batchCode,
            'item_id' => $item->id,
            'warehouse_id' => $warehouse->id,
            'quantity' => $qty,
            'initial_quantity' => $qty,
            'mfg_date' => now()->subMonths(1),
            'expiry_date' => $expiryDate,
            'status' => $status,
        ]);

        // Cập nhật tồn kho aggregate
        $inventory = Inventory::firstOrCreate(
            ['warehouse_id' => $warehouse->id, 'item_id' => $item->id],
            ['quantity_on_hand' => 0, 'quantity_reserved' => 0, 'quantity_available' => 0]
        );

        $oldVal = $inventory->quantity_on_hand;
        $inventory->quantity_on_hand += $qty;
        $inventory->quantity_available += $qty;
        $inventory->last_updated_at = now();
        $inventory->save();

        // Ghi transaction
        InventoryTransaction::create([
            'inventory_id' => $inventory->id,
            'warehouse_id' => $warehouse->id,
            'item_id' => $item->id,
            'batch_id' => $batch->id,
            'reference_type' => 'batch',
            'reference_id' => $batch->id,
            'type' => 'IN',
            'quantity' => $qty,
            'quantity_before' => $oldVal,
            'quantity_after' => $inventory->quantity_on_hand,
            'note' => "Seeder: Nhập lô $status cho $item->name",
        ]);
    }
}
