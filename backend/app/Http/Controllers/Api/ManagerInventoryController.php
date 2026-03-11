<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Inventory;
use App\Models\Warehouse;
use Illuminate\Http\Request;

class ManagerInventoryController extends Controller
{
    public function index(Request $request)
    {
        $warehouseQuery = Warehouse::where('type', 'KITCHEN')->where('status', 'ACTIVE');
        if ($request->filled('warehouse_id')) {
            $warehouseQuery->where('id', $request->warehouse_id);
        }
        $warehouseIds = $warehouseQuery->pluck('id');

        $query = Inventory::with(['warehouse', 'item'])
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

        $kitchens = Warehouse::where('type', 'KITCHEN')->where('status', 'ACTIVE')
            ->select('id', 'code', 'name')->get();

        return response()->json([
            'success'  => true,
            'kitchens' => $kitchens,
            'data'     => $inventory,
        ]);
    }

    public function transactions(Request $request)
    {
        $warehouseIds = Warehouse::where('type', 'KITCHEN')->pluck('id');

        $query = \App\Models\InventoryTransaction::with(['item', 'warehouse', 'user'])
            ->whereIn('warehouse_id', $warehouseIds);

        if ($request->filled('warehouse_id')) {
            $query->where('warehouse_id', $request->warehouse_id);
        }
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
