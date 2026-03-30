<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Inventory;
use App\Models\InventoryTransaction;
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
            })->whereColumn('quantity_available', '<=',
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
            ->where(function($q) use ($batchCode, $decodedCode) {
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

            // 5) Validate và cập nhật batch
            if ($sourceBatch->delivery_status === 'received') {
                return response()->json([
                    'success' => false,
                    'message' => 'Lô hàng này đã được nhận trước đó'
                ], 422);
            }

            // Validate đúng store
            if ($sourceBatch->order && $sourceBatch->order->store_id !== $user->store_id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Lô hàng này không thuộc cửa hàng của bạn'
                ], 403);
            }

            // Cập nhật batch = received
            $sourceBatch->update(['delivery_status' => 'received']);

            // 6) Kiểm tra tất cả batch của đơn đã received chưa
            if ($sourceBatch->order_id) {
                $order = $sourceBatch->order;
                
                // Lấy tất cả batch của đơn này
                $totalBatches = \App\Models\Batch::where('order_id', $order->id)->count();
                $receivedBatches = \App\Models\Batch::where('order_id', $order->id)
                    ->where('delivery_status', 'received')
                    ->count();

                // Nếu tất cả đã received → COMPLETED
                if ($totalBatches > 0 && $totalBatches === $receivedBatches) {
                    $order->update([
                        'status'        => \App\Models\Order::STATUS_COMPLETED,
                        'completed_at'  => now(),
                        'delivered_at'  => now(),
                    ]);
                    
                    // Cập nhật delivery status = COMPLETED nếu tất cả orders trong delivery đều completed
                    $deliveryItem = \App\Models\DeliveryItem::where('order_id', $order->id)
                        ->where('status', 'PENDING')
                        ->first();
                    
                    if ($deliveryItem) {
                        $deliveryItem->update([
                            'status' => 'DELIVERED',
                            'delivered_at' => now(),
                        ]);
                        
                        // Kiểm tra tất cả orders trong delivery đã delivered chưa
                        $delivery = $deliveryItem->delivery;
                        $totalOrders = $delivery->items()->count();
                        $deliveredOrders = $delivery->items()->where('status', 'DELIVERED')->count();
                        
                        if ($totalOrders > 0 && $totalOrders === $deliveredOrders) {
                            $delivery->update([
                                'status' => \App\Models\Delivery::STATUS_DELIVERED,
                                'completed_at' => now(),
                            ]);
                        }
                    }
                }
            }

            \Log::info('Transaction completed successfully');
            
            // Tính số lô còn lại chưa nhận
            $remainingBatches = 0;
            $totalBatchesForOrder = 0;
            if ($sourceBatch->order_id) {
                $totalBatchesForOrder = \App\Models\Batch::where('order_id', $sourceBatch->order_id)->count();
                $receivedBatches = \App\Models\Batch::where('order_id', $sourceBatch->order_id)
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
}
