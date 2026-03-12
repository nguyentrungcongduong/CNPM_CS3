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
        // Đảm bảo có Bếp
        $kitchen = Warehouse::where('type', 'KITCHEN')->first();
        if (!$kitchen) {
            $kitchen = Warehouse::create([
                'code' => 'WH-CK-01',
                'name' => 'Bếp Trung Tâm Sài Gòn',
                'type' => 'KITCHEN',
                'address' => '123 District 1',
                'status' => 'ACTIVE'
            ]);
        }

        // Đảm bảo có Item
        if (Item::count() == 0) {
            Item::create(['code' => 'ITEM001', 'name' => 'Thịt bò Mỹ', 'type' => 'NGUYÊN LIỆU', 'unit' => 'KG', 'min_stock' => 10, 'status' => 'ACTIVE']);
            Item::create(['code' => 'ITEM002', 'name' => 'Sữa tươi', 'type' => 'NGUYÊN LIỆU', 'unit' => 'LÍT', 'min_stock' => 20, 'status' => 'ACTIVE']);
            Item::create(['code' => 'ITEM003', 'name' => 'Bột mì', 'type' => 'NGUYÊN LIỆU', 'unit' => 'KG', 'min_stock' => 15, 'status' => 'ACTIVE']);
        }

        $items = Item::all();

        foreach ($items as $index => $item) {
            // Tạo 3 loại lô cho mỗi mặt hàng: Bình thường, Sắp hết hạn, Đã hết hạn

            // 1. Lô bình thường (Còn hạn dài)
            $this->createBatch($kitchen, $item, 100, now()->addMonths(6), 'ACTIVE');

            // 2. Lô sắp hết hạn (Trong vòng 5 ngày tới)
            $this->createBatch($kitchen, $item, 50, now()->addDays(5), 'ACTIVE');

            // 3. Lô đã hết hạn (Của 10 ngày trước)
            $this->createBatch($kitchen, $item, 20, now()->subDays(10), 'EXPIRED');
        }
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
