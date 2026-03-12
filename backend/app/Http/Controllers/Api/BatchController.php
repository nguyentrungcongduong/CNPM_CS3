<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Batch;
use App\Models\Inventory;
use App\Models\InventoryTransaction;
use App\Models\Warehouse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class BatchController extends Controller
{
    public function index(Request $request)
    {
        $query = Batch::with(['item', 'warehouse']);

        if ($request->filled('warehouse_id')) {
            $query->where('warehouse_id', $request->warehouse_id);
        }

        if ($request->filled('item_id')) {
            $query->where('item_id', $request->item_id);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }
        
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('batch_code', 'like', "%$search%")
                  ->orWhereHas('item', fn($iq) => $iq->where('name', 'like', "%$search%"));
            });
        }

        $batches = $query->orderByDesc('created_at')->paginate($request->get('per_page', 20));

        return response()->json([
            'success' => true,
            'data' => $batches
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'item_id' => 'required|exists:items,id',
            'warehouse_id' => 'required|exists:warehouses,id',
            'quantity' => 'required|numeric|min:0.001',
            'mfg_date' => 'nullable|date',
            'expiry_date' => 'nullable|date',
            'note' => 'nullable|string',
        ]);

        return DB::transaction(function () use ($validated, $request) {
            // 1. Create Batch
            $batchCode = 'BAT-' . strtoupper(Str::random(8)) . '-' . date('ymd');
            
            $batch = Batch::create([
                'batch_code' => $batchCode,
                'item_id' => $validated['item_id'],
                'warehouse_id' => $validated['warehouse_id'],
                'quantity' => $validated['quantity'],
                'initial_quantity' => $validated['quantity'],
                'mfg_date' => $validated['mfg_date'],
                'expiry_date' => $validated['expiry_date'],
                'status' => 'ACTIVE',
            ]);

            // 2. Update/Create Aggregate Inventory
            $inventory = Inventory::firstOrCreate(
                [
                    'warehouse_id' => $validated['warehouse_id'],
                    'item_id' => $validated['item_id'],
                ],
                [
                    'quantity_on_hand' => 0,
                    'quantity_reserved' => 0,
                    'quantity_available' => 0,
                    'last_updated_at' => now(),
                ]
            );

            $oldQty = $inventory->quantity_on_hand;
            $inventory->quantity_on_hand += $validated['quantity'];
            $inventory->quantity_available += $validated['quantity'];
            $inventory->last_updated_at = now();
            $inventory->save();

            // 3. Log Transaction
            InventoryTransaction::create([
                'inventory_id' => $inventory->id,
                'warehouse_id' => $validated['warehouse_id'],
                'item_id' => $validated['item_id'],
                'batch_id' => $batch->id,
                'user_id' => auth()->id(),
                'reference_type' => 'batch',
                'reference_id' => $batch->id,
                'type' => 'IN',
                'quantity' => $validated['quantity'],
                'quantity_before' => $oldQty,
                'quantity_after' => $inventory->quantity_on_hand,
                'note' => $validated['note'] ?? "Nhập kho theo lô mới: $batchCode",
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Tạo lô hàng thành công',
                'data' => $batch->load(['item', 'warehouse'])
            ], 201);
        });
    }

    public function show($batchCode)
    {
        $batch = Batch::with(['item', 'warehouse'])->where('batch_code', $batchCode)->firstOrFail();
        
        return response()->json([
            'success' => true,
            'data' => $batch
        ]);
    }
}
