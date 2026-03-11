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
}
