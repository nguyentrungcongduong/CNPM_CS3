<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Batch;
use App\Models\Inventory;
use App\Models\InventoryTransaction;
use App\Models\Order;
use App\Models\ProductionPlan;
use App\Models\Warehouse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class KitchenBatchController extends Controller
{
    private function ensureKitchen(Request $request): void
    {
        $user = $request->user();
        $roleCode = $user?->role?->code;

        if (!in_array($roleCode, ['KITCHEN_STAFF', 'CENTRAL_KITCHEN_STAFF'])) {
            abort(response()->json([
                'success' => false,
                'message' => 'Bạn không có quyền thực hiện hành động này (cần vai trò Kitchen Staff)',
            ], 403));
        }
    }

    private function generateUniqueBatchCode(): string
    {
        do {
            $code = 'BAT-' . strtoupper(Str::random(8)) . '-' . now()->format('ymd');
        } while (Batch::where('batch_code', $code)->exists());

        return $code;
    }

    /**
     * POST /api/kitchen/batch/create
     *
     * Body:
     *  - item_id (required)
     *  - quantity (required)
     *  - production_date (nullable date)  -> maps to mfg_date
     *  - expiry_date (nullable date)
     *  - note (nullable string)
     *  - warehouse_id (optional; defaults to current user's warehouse_id)
     */
    public function create(Request $request)
    {
        $this->ensureKitchen($request);

        $validated = $request->validate([
            'order_id' => 'nullable|exists:orders,id',
            'item_id' => 'required|exists:items,id',
            'quantity' => 'required|numeric|min:0.001',
            'production_date' => 'nullable|date',
            'expiry_date' => 'nullable|date|after_or_equal:production_date',
            'note' => 'nullable|string|max:1000',
            'warehouse_id' => 'nullable|exists:warehouses,id',
        ]);

        $user = $request->user();
        $roleCode = $user?->role?->code;

        $warehouseId = $validated['warehouse_id'] ?? $user->warehouse_id;
        if (!$warehouseId) {
            return response()->json([
                'success' => false,
                'message' => 'Thiếu kho bếp để tạo lô sản xuất (warehouse_id)',
            ], 422);
        }

        // Kitchen staff can only create batches for their own kitchen warehouse.
        if ($roleCode === 'CENTRAL_KITCHEN_STAFF' && (int) $warehouseId !== (int) $user->warehouse_id) {
            return response()->json([
                'success' => false,
                'message' => 'Bạn không thể tạo lô cho kho khác',
            ], 403);
        }

        $warehouse = Warehouse::where('id', $warehouseId)
            ->where('type', 'KITCHEN')
            ->where('status', 'ACTIVE')
            ->first();

        if (!$warehouse) {
            return response()->json([
                'success' => false,
                'message' => 'Kho không hợp lệ hoặc không phải kho bếp (KITCHEN)',
            ], 422);
        }

        return DB::transaction(function () use ($validated, $warehouseId, $warehouse) {
            // 1) Create batch
            $batchCode = $this->generateUniqueBatchCode();

            $batch = Batch::create([
                'batch_code' => $batchCode,
                'item_id' => $validated['item_id'],
                'warehouse_id' => $warehouseId,
                'order_id' => $validated['order_id'] ?? null,
                'quantity' => $validated['quantity'],
                'initial_quantity' => $validated['quantity'],
                'mfg_date' => $validated['production_date'] ?? null,
                'expiry_date' => $validated['expiry_date'] ?? null,
                'status' => 'ACTIVE',
                'delivery_status' => 'pending',
            ]);

            // 2) Update/Create aggregate inventory (same convention as BatchController@store)
            $inventory = Inventory::firstOrCreate(
                [
                    'warehouse_id' => $warehouseId,
                    'item_id' => $validated['item_id'],
                ],
                [
                    'quantity_on_hand' => 0,
                    'quantity_reserved' => 0,
                    'quantity_available' => 0,
                    'last_updated_at' => now(),
                ]
            );

            $oldQty = (float) $inventory->quantity_on_hand;
            $inventory->quantity_on_hand += $validated['quantity'];
            $inventory->quantity_available += $validated['quantity'];
            $inventory->last_updated_at = now();
            $inventory->save();

            // 3) Log transaction (include batch_id)
            InventoryTransaction::create([
                'inventory_id' => $inventory->id,
                'warehouse_id' => $warehouseId,
                'item_id' => $validated['item_id'],
                'batch_id' => $batch->id,
                'user_id' => auth()->id(),
                'reference_type' => 'production_batch',
                'reference_id' => $batch->id,
                'type' => 'IN',
                'quantity' => $validated['quantity'],
                'quantity_before' => $oldQty,
                'quantity_after' => (float) $inventory->quantity_on_hand,
                'note' => $validated['note'] ?? "Sản xuất lô mới: $batchCode",
            ]);

            // 4) Mark related order as processed by kitchen (so it can be removed from the kitchen queue)
            if (!empty($validated['order_id'])) {
                Order::where('id', $validated['order_id'])->update([
                    'kitchen_processed_at' => now(),
                ]);
            }

            return response()->json([
                'success' => true,
                'message' => 'Tạo lô sản xuất thành công',
                'data' => $batch->load(['item', 'warehouse']),
            ], 201);
        });
    }

    /**
     * POST /api/kitchen/batch/create-multiple
     * 
     * Tạo nhiều lô sản xuất cùng lúc cho 1 kế hoạch sản xuất
     * 
     * Body:
     *  - production_plan_id (required)
     *  - batches[] (required array)
     *    - item_id (required)
     *    - quantity (required)
     *    - production_date (nullable date)
     *    - expiry_date (nullable date)
     *  - note (nullable string)
     */
    public function createMultiple(Request $request)
    {
        $this->ensureKitchen($request);

        $validated = $request->validate([
            'production_plan_id' => 'required|exists:production_plans,id',
            'batches' => 'required|array|min:1',
            'batches.*.item_id' => 'required|exists:items,id',
            'batches.*.quantity' => 'required|numeric|min:0.001',
            'batches.*.production_date' => 'required|date',
            'batches.*.expiry_date' => 'required|date|after_or_equal:batches.*.production_date',
            'note' => 'nullable|string|max:1000',
        ]);

        $user = $request->user();
        $warehouseId = $user->warehouse_id;

        if (!$warehouseId) {
            return response()->json([
                'success' => false,
                'message' => 'Thiếu kho bếp để tạo lô sản xuất',
            ], 422);
        }

        $warehouse = Warehouse::where('id', $warehouseId)
            ->where('type', 'KITCHEN')
            ->where('status', 'ACTIVE')
            ->first();

        if (!$warehouse) {
            return response()->json([
                'success' => false,
                'message' => 'Kho không hợp lệ hoặc không phải kho bếp',
            ], 422);
        }

        return DB::transaction(function () use ($validated, $warehouseId, $warehouse) {
            $createdBatches = [];
            
            // Lấy tất cả orders của production plan này
            $planOrders = \App\Models\Order::where('production_plan_id', $validated['production_plan_id'])
                ->whereIn('status', [\App\Models\Order::STATUS_IN_PRODUCTION, \App\Models\Order::STATUS_READY])
                ->with('items')
                ->get();
            
            foreach ($validated['batches'] as $batchData) {
                // 1) Create batch
                $batchCode = $this->generateUniqueBatchCode();
                
                // Tìm order chứa item này
                $orderId = null;
                foreach ($planOrders as $order) {
                    $hasItem = $order->items->contains('item_id', $batchData['item_id']);
                    if ($hasItem) {
                        $orderId = $order->id;
                        break;
                    }
                }

                $batch = Batch::create([
                    'batch_code' => $batchCode,
                    'item_id' => $batchData['item_id'],
                    'warehouse_id' => $warehouseId,
                    'order_id' => $orderId,
                    'quantity' => $batchData['quantity'],
                    'initial_quantity' => $batchData['quantity'],
                    'mfg_date' => $batchData['production_date'] ?? null,
                    'expiry_date' => $batchData['expiry_date'] ?? null,
                    'status' => 'ACTIVE',
                    'delivery_status' => 'pending',
                ]);

                // 2) Update aggregate inventory
                $inventory = Inventory::firstOrCreate(
                    [
                        'warehouse_id' => $warehouseId,
                        'item_id' => $batchData['item_id'],
                    ],
                    [
                        'quantity_on_hand' => 0,
                        'quantity_reserved' => 0,
                        'quantity_available' => 0,
                        'last_updated_at' => now(),
                    ]
                );

                $oldQty = (float) $inventory->quantity_on_hand;
                $inventory->quantity_on_hand += $batchData['quantity'];
                $inventory->quantity_available += $batchData['quantity'];
                $inventory->last_updated_at = now();
                $inventory->save();

                // 3) Log transaction
                InventoryTransaction::create([
                    'inventory_id' => $inventory->id,
                    'warehouse_id' => $warehouseId,
                    'item_id' => $batchData['item_id'],
                    'batch_id' => $batch->id,
                    'user_id' => auth()->id(),
                    'reference_type' => 'production_batch',
                    'reference_id' => $batch->id,
                    'type' => 'IN',
                    'quantity' => $batchData['quantity'],
                    'quantity_before' => $oldQty,
                    'quantity_after' => (float) $inventory->quantity_on_hand,
                    'note' => $validated['note'] ?? "Sản xuất lô: $batchCode",
                ]);

                $createdBatches[] = $batch->load(['item', 'warehouse']);
            }

            // 4) Cập nhật kế hoạch sản xuất thành hoàn thành
            \App\Models\ProductionPlan::where('id', $validated['production_plan_id'])
                ->update(['status' => 'COMPLETED']);

            return response()->json([
                'success' => true,
                'message' => "Tạo thành công " . count($createdBatches) . " lô sản xuất",
                'data' => [
                    'batches' => $createdBatches,
                    'count' => count($createdBatches),
                ],
            ], 201);
        });
    }
}

