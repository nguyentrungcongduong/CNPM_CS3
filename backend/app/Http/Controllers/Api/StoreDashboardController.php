<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Batch;
use App\Models\Order;
use App\Models\Warehouse;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class StoreDashboardController extends Controller
{
    public function dashboard(Request $request)
    {
        $user = $request->user();
        $storeId = $user->store_id;

        if (!$storeId) {
            return response()->json([
                'message' => 'Người dùng không thuộc cửa hàng nào',
            ], 403);
        }

        $warehouseIds = Warehouse::where('store_id', $storeId)
            ->where('status', 'ACTIVE')
            ->pluck('id');

        if ($warehouseIds->isEmpty()) {
            return response()->json([
                'summary' => [
                    'pending_orders' => 0,
                    'in_delivery' => 0,
                    'total_items' => 0,
                    'low_stock_items' => 0,
                ],
                'recent_orders' => [],
                'alerts' => [],
            ]);
        }

        // Orders KPI
        $pendingOrders = Order::where('store_id', $storeId)
            ->where('status', Order::STATUS_SUBMITTED)
            ->count();

        $inDelivery = Order::where('store_id', $storeId)
            ->where('status', Order::STATUS_IN_DELIVERY)
            ->count();

        // Inventory aggregation (distinct items across all active warehouses)
        $itemsAgg = DB::table('inventory')
            ->selectRaw('item_id, SUM(quantity_available) as total_qty')
            ->whereIn('warehouse_id', $warehouseIds)
            ->groupBy('item_id')
            ->get();

        $totalItems = $itemsAgg->filter(fn($r) => (float) $r->total_qty > 0)->count();

        $lowStockAll = DB::table('inventory')
            ->join('items', 'items.id', '=', 'inventory.item_id')
            ->selectRaw(
                'items.id as item_id, items.name as item_name, items.unit, items.min_stock, SUM(inventory.quantity_available) as total_qty'
            )
            ->whereIn('inventory.warehouse_id', $warehouseIds)
            ->groupBy('items.id', 'items.name', 'items.unit', 'items.min_stock')
            ->havingRaw('SUM(inventory.quantity_available) <= items.min_stock')
            ->get();

        $lowStockItemsCount = $lowStockAll->count();

        // Recent orders
        $recentOrders = Order::where('store_id', $storeId)
            ->orderByDesc('order_date')
            ->orderByDesc('id')
            ->limit(3)
            ->get(['id', 'order_code', 'status', 'order_date']);

        // Alerts: low stock + expiring soon batches
        $alerts = [];

        foreach ($lowStockAll->take(3) as $row) {
            $qty = (float) $row->total_qty;
            // Format decimal-ish but keep simple for demo
            $qtyText = rtrim(rtrim(number_format($qty, 3, '.', ''), '0'), '.');
            $alerts[] = [
                'type' => 'low_stock',
                'message' => "{$row->item_name} sắp hết hàng ({$qtyText} {$row->unit})",
            ];
        }

        $expiringSoonBatches = Batch::with('item')
            ->whereIn('warehouse_id', $warehouseIds)
            ->expiringSoon(30)
            ->orderBy('expiry_date')
            ->limit(2)
            ->get();

        foreach ($expiringSoonBatches as $b) {
            $expiry = $b->expiry_date ? Carbon::parse($b->expiry_date)->format('d/m/Y') : '';
            $alerts[] = [
                'type' => 'expiry',
                'message' => "Lô {$b->batch_code} hết hạn {$expiry}",
            ];
        }

        return response()->json([
            'summary' => [
                'pending_orders' => $pendingOrders,
                'in_delivery' => $inDelivery,
                'total_items' => $totalItems,
                'low_stock_items' => $lowStockItemsCount,
            ],
            'recent_orders' => $recentOrders,
            'alerts' => $alerts,
        ]);
    }
}
