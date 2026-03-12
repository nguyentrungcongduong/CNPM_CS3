<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Batch;
use App\Models\Inventory;
use App\Models\Item;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class BatchController extends Controller
{
    public function index(Request $request)
    {
        $query = Batch::with(['item', 'warehouse']);

        if ($request->has('item_id')) {
            $query->where('item_id', $request->item_id);
        }

        if ($request->has('warehouse_id')) {
            $query->where('warehouse_id', $request->warehouse_id);
        }

        if ($request->has('batch_number')) {
            $query->where('batch_number', 'like', '%' . $request->batch_number . '%');
        }

        $batches = $query->latest()->paginate($request->get('per_page', 20));

        return response()->json($batches);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'item_id' => 'required|exists:items,id',
            'warehouse_id' => 'required|exists:warehouses,id',
            'batch_number' => 'required|string',
            'manufacturing_date' => 'nullable|date',
            'expiry_date' => 'nullable|date',
            'initial_quantity' => 'required|numeric|min:0',
            'quantity_on_hand' => 'required|numeric|min:0',
            'status' => 'nullable|string',
        ]);

        $batch = Batch::create($validated);

        return response()->json($batch, 201);
    }

    public function show($id)
    {
        $batch = Batch::with(['item', 'warehouse'])->findOrFail($id);
        return response()->json($batch);
    }

    public function showByLot($batch_number)
    {
        $batches = Batch::with(['item', 'warehouse'])
            ->where('batch_number', $batch_number)
            ->get();
            
        return response()->json($batches);
    }

    public function getAlerts(Request $request)
    {
        $expiryDays = $request->get('expiry_days', 30);
        $today = Carbon::today();
        $expiryThreshold = Carbon::today()->addDays($expiryDays);

        // 1. Expiring Soon Batches
        $expiringBatches = Batch::with(['item', 'warehouse'])
            ->where('quantity_on_hand', '>', 0)
            ->whereBetween('expiry_date', [$today, $expiryThreshold])
            ->get();

        // 2. Already Expired Batches
        $expiredBatches = Batch::with(['item', 'warehouse'])
            ->where('quantity_on_hand', '>', 0)
            ->where('expiry_date', '<', $today)
            ->get();

        // 3. Low Stock Items (across all warehouses)
        $lowStockItems = Inventory::with(['item', 'warehouse'])
            ->whereHas('item', function ($q) {
                $q->whereNotNull('min_stock');
            })
            ->whereColumn('quantity_available', '<=',
                DB::raw('(SELECT min_stock FROM items WHERE items.id = inventory.item_id)')
            )
            ->get();

        return response()->json([
            'expiring_soon' => $expiringBatches,
            'expired' => $expiredBatches,
            'low_stock' => $lowStockItems,
        ]);
    }
}
