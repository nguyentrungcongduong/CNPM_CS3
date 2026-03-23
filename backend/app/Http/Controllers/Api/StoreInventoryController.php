<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Inventory;
use App\Models\Store;
use App\Models\Warehouse;
use Illuminate\Http\Request;

class StoreInventoryController extends Controller
{
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
        $batch = \App\Models\Batch::with(['item', 'warehouse'])->where('batch_code', $batchCode)->first();
        if (!$batch) {
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
                'message' => 'Người dùng không thuộc cửa hàng nào',
            ], 403);
        }

        $validated = $request->validate([
            'batch_code'       => 'required|exists:batches,batch_code',
            'quantity'         => 'required|numeric|min:0.001',
            'quality_feedback' => 'nullable|string',
        ]);

        return \Illuminate\Support\Facades\DB::transaction(function () use ($validated, $user) {
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

            // Tùy chọn: Có thể trừ tồn kho / số lượng Batch của bếp (nếu quy trình quy định).
            // Tạm thời đơn giản: chỉ nhập vào store.

            return response()->json([
                'success' => true,
                'message' => 'Nhận hàng thành công',
                'data'    => $storeBatch->load(['item', 'warehouse'])
            ], 201);
        });
    }
}
