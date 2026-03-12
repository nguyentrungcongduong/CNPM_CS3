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
    /**
     * Retrieve a paginated list of batches, optionally filtered by item, warehouse, or partial batch number.
     *
     * Accepts query parameters: `item_id`, `warehouse_id`, `batch_number` (partial match), and `per_page` (pagination size).
     *
     * @param \Illuminate\Http\Request $request The incoming HTTP request containing optional filter and pagination query parameters.
     * @return \Illuminate\Http\JsonResponse Paginated batches including each batch's related `item` and `warehouse`.
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

    /**
     * Create a new Batch from validated request data and return it.
     *
     * Validates required item and warehouse existence, batch_number, initial and on-hand quantities, and optional manufacturing_date, expiry_date, and status, then creates the Batch.
     *
     * @return \Illuminate\Http\JsonResponse JSON response containing the created Batch and HTTP status 201.
     */
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

    /**
     * Retrieve a Batch by its identifier, including its related item and warehouse.
     *
     * @param int|string $id The Batch identifier.
     * @return \Illuminate\Http\JsonResponse The found Batch model with `item` and `warehouse` relations.
     * @throws \Illuminate\Database\Eloquent\ModelNotFoundException If no Batch exists for the given id.
     */
    public function show($id)
    {
        $batch = Batch::with(['item', 'warehouse'])->findOrFail($id);
        return response()->json($batch);
    }

    /**
     * Retrieve all batches that share the specified batch number, including each batch's item and warehouse relations.
     *
     * @param string|int $batch_number The batch number to search for.
     * @return \Illuminate\Http\JsonResponse JSON array of Batch models with `item` and `warehouse` relations loaded.
     */
    public function showByLot($batch_number)
    {
        $batches = Batch::with(['item', 'warehouse'])
            ->where('batch_number', $batch_number)
            ->get();
            
        return response()->json($batches);
    }

    /**
     * Gather inventory alerts: batches expiring soon, already expired batches, and low-stock inventory entries.
     *
     * The request may include an optional `expiry_days` parameter (default 30) that determines the window for
     * "expiring soon" batches.
     *
     * @param \Illuminate\Http\Request $request Request object; accepts an optional `expiry_days` integer query parameter.
     * @return \Illuminate\Http\JsonResponse JSON object with three keys:
     *         - `expiring_soon`: array of Batch models (with `item` and `warehouse` relations) whose `quantity_on_hand` > 0 and `expiry_date` is between today and today + expiry_days.
     *         - `expired`: array of Batch models (with `item` and `warehouse` relations) whose `quantity_on_hand` > 0 and `expiry_date` is before today.
     *         - `low_stock`: array of Inventory models (with `item` and `warehouse` relations) where the related item's `min_stock` is set and `quantity_available` is less than or equal to that `min_stock`.
     */
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
