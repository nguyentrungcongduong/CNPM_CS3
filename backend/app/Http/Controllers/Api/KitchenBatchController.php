<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Batch;
use App\Models\Inventory;
use App\Models\InventoryTransaction;
use App\Models\Order;
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
                'quantity' => $validated['quantity'],
                'initial_quantity' => $validated['quantity'],
                'mfg_date' => $validated['production_date'] ?? null,
                'expiry_date' => $validated['expiry_date'] ?? null,
                'status' => 'ACTIVE',
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
}

