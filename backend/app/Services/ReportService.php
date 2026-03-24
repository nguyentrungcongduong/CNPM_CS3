<?php

namespace App\Services;

use App\Models\Batch;
use App\Models\Delivery;
use App\Models\Order;
use App\Models\Warehouse;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ReportService
{
    public function getManagerDashboard(): array
    {
        $today = Carbon::today();
        $tomorrow = (clone $today)->addDay();

        $rawTodayStatuses = Order::query()
            ->where('created_at', '>=', $today)
            ->where('created_at', '<', $tomorrow)
            ->select('status', DB::raw('COUNT(*) as total'))
            ->groupBy('status')
            ->pluck('total', 'status');

        // Debug visibility for dashboard mismatch investigations.
        Log::info('Manager dashboard today order statuses', [
            'date' => $today->toDateString(),
            'statuses' => $rawTodayStatuses->toArray(),
        ]);

        $todayOrdersByStatus = $this->mapDashboardStatuses($rawTodayStatuses);

        $lowStockItemsCount = DB::table('inventory')
            ->join('items', 'items.id', '=', 'inventory.item_id')
            ->whereNotNull('items.min_stock')
            ->whereColumn('inventory.quantity_available', '<=', 'items.min_stock')
            ->distinct('inventory.item_id')
            ->count('inventory.item_id');

        $expiredItemsCount = Batch::query()
            ->where('quantity', '>', 0)
            ->whereDate('expiry_date', '<', $today)
            ->distinct('item_id')
            ->count('item_id');

        $expiringItemsCount = Batch::query()
            ->where('quantity', '>', 0)
            ->whereDate('expiry_date', '>=', $today)
            ->whereDate('expiry_date', '<=', (clone $today)->addDays(30))
            ->distinct('item_id')
            ->count('item_id');

        $delayedDeliveriesCount = Delivery::query()
            ->whereDate('scheduled_date', '<', $today)
            ->whereNotIn('status', [Delivery::STATUS_DELIVERED, Delivery::STATUS_CANCELLED])
            ->count();

        return [
            'today_orders_count' => (int) array_sum($todayOrdersByStatus),
            'today_orders_by_status' => [
                'submitted' => (int) ($todayOrdersByStatus['submitted'] ?? 0),
                'confirmed' => (int) ($todayOrdersByStatus['confirmed'] ?? 0),
                'in_production' => (int) ($todayOrdersByStatus['in_production'] ?? 0),
                'delivering' => (int) ($todayOrdersByStatus['delivering'] ?? 0),
                'completed' => (int) ($todayOrdersByStatus['completed'] ?? 0),
            ],
            'low_stock_items_count' => (int) $lowStockItemsCount,
            'expiring_items_count' => (int) $expiringItemsCount,
            'expired_items_count' => (int) $expiredItemsCount,
            'delayed_deliveries_count' => (int) $delayedDeliveriesCount,
        ];
    }

    public function getSystemInventoryReport(): array
    {
        $kitchenWarehouseIds = Warehouse::query()
            ->where('type', 'KITCHEN')
            ->pluck('id');

        $totalItems = (int) DB::table('inventory')
            ->distinct('item_id')
            ->count('item_id');

        $totalQuantity = (float) DB::table('inventory')
            ->sum('quantity_available');

        $centralKitchenInventory = DB::table('inventory')
            ->whereIn('warehouse_id', $kitchenWarehouseIds)
            ->selectRaw('COUNT(DISTINCT item_id) as total_items, COALESCE(SUM(quantity_available), 0) as total_quantity')
            ->first();

        $perStoreInventory = DB::table('inventory')
            ->join('warehouses', 'warehouses.id', '=', 'inventory.warehouse_id')
            ->join('stores', 'stores.id', '=', 'warehouses.store_id')
            ->where('warehouses.type', 'STORE')
            ->groupBy('stores.id', 'stores.code', 'stores.name')
            ->selectRaw('
                stores.id as store_id,
                stores.code as store_code,
                stores.name as store_name,
                COUNT(DISTINCT inventory.item_id) as total_items,
                COALESCE(SUM(inventory.quantity_available), 0) as total_quantity
            ')
            ->orderBy('stores.id')
            ->get()
            ->map(function ($row) {
                return [
                    'store_id' => (int) $row->store_id,
                    'store_code' => $row->store_code,
                    'store_name' => $row->store_name,
                    'total_items' => (int) $row->total_items,
                    'total_quantity' => (float) $row->total_quantity,
                ];
            })
            ->values()
            ->all();

        return [
            'total_items' => $totalItems,
            'total_quantity' => $totalQuantity,
            'breakdown' => [
                'central_kitchen_inventory' => [
                    'total_items' => (int) ($centralKitchenInventory->total_items ?? 0),
                    'total_quantity' => (float) ($centralKitchenInventory->total_quantity ?? 0),
                ],
                'per_store_inventory' => $perStoreInventory,
            ],
        ];
    }

    public function getProductionReport(string $range): array
    {
        if ($range === 'monthly') {
            return $this->getMonthlyProductionReport();
        }

        return $this->getWeeklyProductionReport();
    }

    public function getOrderSummaryForManager(array $statuses, ?string $dateFrom, ?string $dateTo): array
    {
        $query = Order::query()
            ->with(['store:id,code,name', 'items.item:id,code,name'])
            ->whereIn('status', $statuses);

        if (!empty($dateFrom)) {
            $query->whereDate('order_date', '>=', $dateFrom);
        }
        if (!empty($dateTo)) {
            $query->whereDate('order_date', '<=', $dateTo);
        }

        $orders = $query->get();

        $byStore = $orders->groupBy('store_id')->map(function ($storeOrders) {
            $store = $storeOrders->first()?->store;

            return [
                'store_id' => $store?->id,
                'store_code' => $store?->code,
                'store_name' => $store?->name,
                'order_count' => $storeOrders->count(),
                'statuses' => $storeOrders->pluck('status')->countBy()->toArray(),
                'orders' => $storeOrders->map(function ($order) {
                    return [
                        'id' => $order->id,
                        'order_code' => $order->order_code,
                        'status' => $order->status,
                        'order_date' => $order->order_date,
                        'required_date' => $order->required_date,
                        'items_count' => $order->items->count(),
                    ];
                })->values()->all(),
            ];
        })->values()->all();

        $itemTotals = [];
        foreach ($orders as $order) {
            foreach ($order->items as $orderItem) {
                $itemId = $orderItem->item_id;
                if (!isset($itemTotals[$itemId])) {
                    $itemTotals[$itemId] = [
                        'item_id' => $itemId,
                        'item_code' => $orderItem->item?->code,
                        'item_name' => $orderItem->item?->name,
                        'unit' => $orderItem->unit,
                        'total_ordered' => 0.0,
                        'total_approved' => 0.0,
                        'store_breakdown' => [],
                    ];
                }

                $itemTotals[$itemId]['total_ordered'] += (float) $orderItem->ordered_quantity;
                $itemTotals[$itemId]['total_approved'] += (float) ($orderItem->approved_quantity ?? $orderItem->ordered_quantity);

                $storeCode = $order->store?->code ?? 'N/A';
                if (!isset($itemTotals[$itemId]['store_breakdown'][$storeCode])) {
                    $itemTotals[$itemId]['store_breakdown'][$storeCode] = 0.0;
                }
                $itemTotals[$itemId]['store_breakdown'][$storeCode] += (float) $orderItem->ordered_quantity;
            }
        }

        $byItem = array_values(array_map(function ($row) {
            $row['store_breakdown'] = array_map(
                fn($quantity, $code) => ['store_code' => $code, 'quantity' => $quantity],
                $row['store_breakdown'],
                array_keys($row['store_breakdown'])
            );

            return $row;
        }, $itemTotals));

        usort($byItem, fn($a, $b) => $b['total_ordered'] <=> $a['total_ordered']);

        return [
            'total_orders' => $orders->count(),
            'total_stores' => count($byStore),
            'statuses' => $orders->pluck('status')->countBy()->toArray(),
            'by_store' => $byStore,
            'by_item' => $byItem,
        ];
    }

    private function getWeeklyProductionReport(): array
    {
        $endDate = Carbon::today();
        $startDate = (clone $endDate)->subDays(6);

        $productionRows = Batch::query()
            ->whereDate('mfg_date', '>=', $startDate)
            ->whereDate('mfg_date', '<=', $endDate)
            ->selectRaw('DATE(mfg_date) as period_key, COALESCE(SUM(quantity), 0) as total_production_quantity')
            ->groupBy(DB::raw('DATE(mfg_date)'))
            ->pluck('total_production_quantity', 'period_key');

        $processedRows = Order::query()
            ->whereNotNull('completed_at')
            ->whereDate('completed_at', '>=', $startDate)
            ->whereDate('completed_at', '<=', $endDate)
            ->selectRaw('DATE(completed_at) as period_key, COUNT(*) as number_of_orders_processed')
            ->groupBy(DB::raw('DATE(completed_at)'))
            ->pluck('number_of_orders_processed', 'period_key');

        $result = [];
        $cursor = $startDate->copy();
        while ($cursor->lte($endDate)) {
            $key = $cursor->toDateString();
            $result[] = [
                'date' => $key,
                'total_production_quantity' => (float) ($productionRows[$key] ?? 0),
                'number_of_orders_processed' => (int) ($processedRows[$key] ?? 0),
            ];
            $cursor->addDay();
        }

        return $result;
    }

    private function getMonthlyProductionReport(): array
    {
        $endMonth = Carbon::today()->startOfMonth();
        $startMonth = (clone $endMonth)->subMonths(11);
        $endMonthLastDay = $endMonth->copy()->endOfMonth();
        $monthExpr = $this->monthGroupingExpression('mfg_date');
        $completedMonthExpr = $this->monthGroupingExpression('completed_at');

        $productionRows = Batch::query()
            ->whereDate('mfg_date', '>=', $startMonth)
            ->whereDate('mfg_date', '<=', $endMonthLastDay)
            ->selectRaw("{$monthExpr} as period_key, COALESCE(SUM(quantity), 0) as total_production_quantity")
            ->groupBy(DB::raw($monthExpr))
            ->pluck('total_production_quantity', 'period_key');

        $processedRows = Order::query()
            ->whereNotNull('completed_at')
            ->whereDate('completed_at', '>=', $startMonth)
            ->whereDate('completed_at', '<=', $endMonthLastDay)
            ->selectRaw("{$completedMonthExpr} as period_key, COUNT(*) as number_of_orders_processed")
            ->groupBy(DB::raw($completedMonthExpr))
            ->pluck('number_of_orders_processed', 'period_key');

        $result = [];
        $cursor = $startMonth->copy();
        while ($cursor->lte($endMonth)) {
            $key = $cursor->format('Y-m');
            $result[] = [
                'date' => $key,
                'total_production_quantity' => (float) ($productionRows[$key] ?? 0),
                'number_of_orders_processed' => (int) ($processedRows[$key] ?? 0),
            ];
            $cursor->addMonth();
        }

        return $result;
    }

    private function monthGroupingExpression(string $column): string
    {
        $driver = DB::connection()->getDriverName();

        return match ($driver) {
            'sqlite' => "strftime('%Y-%m', {$column})",
            default => "DATE_FORMAT({$column}, '%Y-%m')",
        };
    }

    /**
     * Map both current and legacy statuses to dashboard keys.
     * This keeps metrics correct while data transitions from legacy flow.
     */
    private function mapDashboardStatuses($rawStatuses): array
    {
        $mapped = [
            'submitted' => 0,
            'confirmed' => 0,
            'in_production' => 0,
            'delivering' => 0,
            'completed' => 0,
        ];

        $statusToKey = [
            Order::STATUS_SUBMITTED => 'submitted',
            'PENDING' => 'submitted',

            Order::STATUS_CONFIRMED => 'confirmed',
            'APPROVED' => 'confirmed',

            Order::STATUS_IN_PRODUCTION => 'in_production',
            'PROCESSING' => 'in_production',

            Order::STATUS_IN_DELIVERY => 'delivering',
            'DELIVERING' => 'delivering',

            Order::STATUS_COMPLETED => 'completed',
            Order::STATUS_DELIVERED => 'completed',
        ];

        foreach ($rawStatuses as $status => $total) {
            $normalizedStatus = strtoupper((string) $status);
            $targetKey = $statusToKey[$normalizedStatus] ?? null;
            if ($targetKey !== null) {
                $mapped[$targetKey] += (int) $total;
            }
        }

        return $mapped;
    }
}

