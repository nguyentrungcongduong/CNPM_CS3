<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Batch;
use App\Models\Delivery;
use App\Models\DeliveryItem;
use App\Models\Inventory;
use App\Models\InventoryTransaction;
use App\Models\Order;
use App\Models\Store;
use App\Models\Warehouse;
use Illuminate\Http\Request;

class StoreInventoryController extends Controller
{
    public function myInventory(Request $request)
    {
        $user = $request->user();
        $storeId = $user->store_id;

        if (!$storeId) {
            return response()->json([
                'success' => false,
                'message' => 'Ngườii dùng không thuộc cửa hàng nào'
            ], 403);
        }

        return $this->show($request, $storeId);
    }

    public function show(Request $request, int $storeId)
    {
        $store = Store::findOrFail($storeId);

        $warehouseIds = Warehouse::where('store_id', $storeId)
            ->where('status', 'ACTIVE')
            ->pluck('id');

        $query = Inventory::with(['item', 'warehouse'])
            ->whereIn('warehouse_id', $warehouseIds);

        if ($request->filled('search')) {
            $search = $request->search;
            $query->whereHas('item', function ($q) use ($search) {
                $q->where('name', 'like', "%$search%")
                    ->orWhere('code', 'like', "%$search%");
            });
        }

        if ($request->filled('item_type')) {
            $query->whereHas('item', fn($q) => $q->where('type', $request->item_type));
        }

        if ($request->boolean('low_stock')) {
            $query->whereHas('item', function ($q) {
                $q->whereNotNull('min_stock');
            })->whereColumn(
                'quantity_available',
                '<=',
                \DB::raw('(SELECT min_stock FROM items WHERE items.id = inventory.item_id)')
            );
        }

        $inventory = $query->orderBy('created_at')->paginate($request->get('per_page', 20));

        return response()->json([
            'success' => true,
            'store'   => $store,
            'data'    => $inventory,
        ]);
    }

    public function transactions(Request $request, int $storeId)
    {
        Store::findOrFail($storeId);

        $warehouseIds = Warehouse::where('store_id', $storeId)->pluck('id');

        $query = \App\Models\InventoryTransaction::with(['item', 'warehouse', 'user'])
            ->whereIn('warehouse_id', $warehouseIds);

        if ($request->filled('type')) {
            $query->where('type', $request->type);
        }
        if ($request->filled('date_from')) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }
        if ($request->filled('date_to')) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }

        $transactions = $query->orderByDesc('created_at')->paginate($request->get('per_page', 20));

        return response()->json([
            'success' => true,
            'data'    => $transactions,
        ]);
    }

    public function getBatch(Request $request, $batchCode)
    {
        \Log::info('getBatch called', ['batch_code' => $batchCode, 'url' => $request->url()]);

        // Decode nếu bị encode
        $decodedCode = urldecode($batchCode);

        $batch = \App\Models\Batch::with(['item', 'warehouse'])
            ->where(function ($q) use ($batchCode, $decodedCode) {
                $q->where('batch_code', $batchCode)
                    ->orWhere('batch_code', $decodedCode);
            })
            ->first();

        if (!$batch) {
            \Log::warning('Batch not found', ['batch_code' => $batchCode, 'decoded' => $decodedCode]);
            return response()->json([
                'success' => false,
                'message' => 'Lô hàng không tồn tại',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data'    => $batch,
        ]);
    }

    public function receiveBatch(Request $request)
    {
        $user = $request->user();
        if (!$user->store_id) {
            return response()->json([
                'success' => false,
                'message' => 'Ngườii dùng không thuộc cửa hàng nào',
            ], 403);
        }

        $validated = $request->validate([
            'batch_code'       => 'required|exists:batches,batch_code',
            'quantity'         => 'required|numeric|min:0.001',
            'quality_feedback' => 'nullable|string',
            'order_id'         => 'nullable|exists:orders,id',
        ]);

        \Log::info('receiveBatch started', [
            'batch_code' => $validated['batch_code'],
            'quantity' => $validated['quantity'],
            'store_id' => $user->store_id,
            'user_id' => $user->id
        ]);

        try {
            return \Illuminate\Support\Facades\DB::transaction(function () use ($validated, $user) {
                \Log::info('Transaction started');
                $sourceBatch = \App\Models\Batch::with('item')->where('batch_code', $validated['batch_code'])->first();
                $storeWarehouse = Warehouse::where('store_id', $user->store_id)->where('status', 'ACTIVE')->first();

                if (!$storeWarehouse) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Cửa hàng không có kho đang hoạt động',
                    ], 422);
                }

                // Tạo lô mới tại kho của cửa hàng để theo dõi
                $storeBatchCode = 'SBAT-' . \Illuminate\Support\Str::random(6) . '-' . now()->format('ymd');
                $storeBatch = \App\Models\Batch::create([
                    'batch_code'       => $storeBatchCode,
                    'item_id'          => $sourceBatch->item_id,
                    'warehouse_id'     => $storeWarehouse->id,
                    'quantity'         => $validated['quantity'],
                    'initial_quantity' => $validated['quantity'],
                    'mfg_date'         => $sourceBatch->mfg_date,
                    'expiry_date'      => $sourceBatch->expiry_date,
                    'status'           => 'ACTIVE',
                ]);

                // Cập nhật Inventory của cửa hàng
                $inventory = Inventory::firstOrCreate(
                    [
                        'warehouse_id' => $storeWarehouse->id,
                        'item_id'      => $sourceBatch->item_id,
                    ],
                    [
                        'quantity_on_hand'   => 0,
                        'quantity_reserved'  => 0,
                        'quantity_available' => 0,
                        'last_updated_at'    => now(),
                    ]
                );

                $oldQty = $inventory->quantity_on_hand;
                $inventory->quantity_on_hand += $validated['quantity'];
                $inventory->quantity_available += $validated['quantity'];
                $inventory->last_updated_at = now();
                $inventory->save();

                // Ghi log giao dịch nhập kho
                $note = "Nhận từ lô gốc: {$sourceBatch->batch_code}. Phản hồi: " . ($validated['quality_feedback'] ?? 'Không có');

                \App\Models\InventoryTransaction::create([
                    'inventory_id'    => $inventory->id,
                    'warehouse_id'    => $storeWarehouse->id,
                    'item_id'         => $sourceBatch->item_id,
                    'batch_id'        => $storeBatch->id,
                    'user_id'         => $user->id,
                    'reference_type'  => 'receive_batch',
                    'reference_id'    => $sourceBatch->id,
                    'type'            => 'IN',
                    'quantity'        => $validated['quantity'],
                    'quantity_before' => $oldQty,
                    'quantity_after'  => $inventory->quantity_on_hand,
                    'note'            => $note,
                ]);

                // 4) Giảm tồn kho Kitchen (nguồn xuất hàng)
                $kitchenInventory = Inventory::where('warehouse_id', $sourceBatch->warehouse_id)
                    ->where('item_id', $sourceBatch->item_id)
                    ->first();

                if ($kitchenInventory) {
                    // Kiểm tra đủ hàng trước khi trừ
                    if ($kitchenInventory->quantity_available < $validated['quantity']) {
                        return response()->json([
                            'success' => false,
                            'message' => "Bếp trung tâm không đủ hàng để xuất. Tồn kho hiện tại: {$kitchenInventory->quantity_available}, cần: {$validated['quantity']}. Vui lòng liên hệ Manager nhập thêm kho.",
                        ], 422);
                    }
                    $kitchenOldQty = $kitchenInventory->quantity_on_hand;
                    $kitchenInventory->quantity_on_hand -= $validated['quantity'];
                    $kitchenInventory->quantity_available -= $validated['quantity'];
                    $kitchenInventory->last_updated_at = now();
                    $kitchenInventory->save();

                    // Log giao dịch xuất kho Kitchen
                    InventoryTransaction::create([
                        'inventory_id'    => $kitchenInventory->id,
                        'warehouse_id'    => $sourceBatch->warehouse_id,
                        'item_id'         => $sourceBatch->item_id,
                        'batch_id'        => $sourceBatch->id,
                        'user_id'         => $user->id,
                        'reference_type'  => 'transfer_to_store',
                        'reference_id'    => $storeBatch->id,
                        'type'            => 'OUT',
                        'quantity'        => $validated['quantity'],
                        'quantity_before' => $kitchenOldQty,
                        'quantity_after'  => $kitchenInventory->quantity_on_hand,
                        'note'            => "Xuất kho đến cửa hàng: {$storeWarehouse->name} (Lô: {$storeBatch->batch_code})",
                    ]);
                }

                // Cập nhật batch nguồn = đã nhận
                $sourceBatch->update(['delivery_status' => 'received']);

                if ($sourceBatch->order_id) {
                    $this->syncOrderAndDeliveryAfterAllBatchesReceived((int) $sourceBatch->order_id);
                }

                \Log::info('Transaction completed successfully');

                // Tính số lô còn lại chưa nhận
                $remainingBatches = 0;
                $totalBatchesForOrder = 0;
                if ($sourceBatch->order_id) {
                    $totalBatchesForOrder = Batch::where('order_id', $sourceBatch->order_id)->count();
                    $receivedBatches = Batch::where('order_id', $sourceBatch->order_id)
                        ->where('delivery_status', 'received')
                        ->count();
                    $remainingBatches = $totalBatchesForOrder - $receivedBatches;
                }

                return response()->json([
                    'success' => true,
                    'message' => $remainingBatches > 0
                        ? "Nhận hàng thành công! Còn {$remainingBatches}/{$totalBatchesForOrder} lô chưa nhận."
                        : 'Nhận hàng thành công! Tất cả lô đã được nhận.',
                    'data'    => [
                        'batch' => $storeBatch->load(['item', 'warehouse']),
                        'received_count' => $totalBatchesForOrder - $remainingBatches,
                        'total_count' => $totalBatchesForOrder,
                        'remaining_count' => $remainingBatches,
                        'order_completed' => $remainingBatches === 0 && $totalBatchesForOrder > 0
                    ]
                ], 201);
            });
        } catch (\Exception $e) {
            \Log::error('receiveBatch failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Lỗi hệ thống: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Khi mọi lô của đơn đã scan nhận: hoàn tất đơn + delivery_item + đóng lịch giao (DELIVERED).
     */
    private function syncOrderAndDeliveryAfterAllBatchesReceived(int $orderId): void
    {
        $order = Order::find($orderId);
        if (!$order) {
            return;
        }

        $totalBatches = Batch::where('order_id', $order->id)->count();
        if ($totalBatches === 0) {
            return;
        }

        $receivedBatches = Batch::where('order_id', $order->id)
            ->where('delivery_status', 'received')
            ->count();

        if ($totalBatches !== $receivedBatches) {
            return;
        }

        $order->update([
            'status'       => Order::STATUS_COMPLETED,
            'completed_at' => now(),
            'delivered_at' => now(),
        ]);

        $deliveryItems = DeliveryItem::where('order_id', $order->id)
            ->where('status', '!=', 'DELIVERED')
            ->get();

        foreach ($deliveryItems as $deliveryItem) {
            $deliveryItem->update([
                'status'       => 'DELIVERED',
                'delivered_at' => now(),
            ]);
        }

        $deliveryIds = DeliveryItem::where('order_id', $order->id)->pluck('delivery_id')->unique()->filter();

        foreach ($deliveryIds as $deliveryId) {
            $delivery = Delivery::with('items')->find($deliveryId);
            if (!$delivery) {
                continue;
            }

            $total = $delivery->items->count();
            $delivered = $delivery->items->where('status', 'DELIVERED')->count();

            if ($total > 0 && $delivered === $total) {
                $delivery->update([
                    'status'       => Delivery::STATUS_DELIVERED,
                    'completed_at' => now(),
                ]);
            }
        }
    }
}
