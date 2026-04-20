<?php
// Tạo batch để tồn kho bếp tăng lên
use App\Models\Batch;
use App\Models\Inventory;
use App\Models\InventoryTransaction;
use App\Models\Item;
use App\Models\Warehouse;
use Illuminate\Support\Str;

$kitchen = Warehouse::where('type', 'KITCHEN')->where('status', 'ACTIVE')->first();
$items   = Item::all();

echo "===== KITCHEN: {$kitchen->name} (ID={$kitchen->id}) =====" . PHP_EOL;

foreach ($items as $item) {
    $qty       = rand(50, 200);
    $batchCode = 'BAT-' . strtoupper(Str::random(6)) . '-' . now()->format('ymd');

    $batch = Batch::create([
        'batch_code'       => $batchCode,
        'item_id'          => $item->id,
        'warehouse_id'     => $kitchen->id,
        'quantity'         => $qty,
        'initial_quantity' => $qty,
        'mfg_date'         => now()->toDateString(),
        'expiry_date'      => now()->addMonths(3)->toDateString(),
        'status'           => 'ACTIVE',
        'delivery_status'  => 'pending',
    ]);

    $inv = Inventory::firstOrCreate(
        ['warehouse_id' => $kitchen->id, 'item_id' => $item->id],
        ['quantity_on_hand' => 0, 'quantity_reserved' => 0, 'quantity_available' => 0, 'last_updated_at' => now()]
    );
    $old = $inv->quantity_on_hand;
    $inv->quantity_on_hand   += $qty;
    $inv->quantity_available += $qty;
    $inv->last_updated_at     = now();
    $inv->save();

    InventoryTransaction::create([
        'inventory_id'    => $inv->id,
        'warehouse_id'    => $kitchen->id,
        'item_id'         => $item->id,
        'batch_id'        => $batch->id,
        'user_id'         => 1,
        'reference_type'  => 'production_batch',
        'reference_id'    => $batch->id,
        'type'            => 'IN',
        'quantity'        => $qty,
        'quantity_before' => $old,
        'quantity_after'  => $inv->quantity_on_hand,
        'note'            => "Demo: Sản xuất lô {$batchCode}",
    ]);

    echo "  ✓ [{$item->code}] {$item->name} → +{$qty} (batch: {$batchCode})" . PHP_EOL;
}

echo PHP_EOL . "Xong! Reload trang /manager/kitchen-inventory để kiểm tra." . PHP_EOL;
