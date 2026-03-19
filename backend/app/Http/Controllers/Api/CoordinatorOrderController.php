<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Jobs\SendOrderNotification;
use App\Models\Order;
use App\Models\OrderItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * CoordinatorOrderController
 *
 * Handles Supply Coordinator actions on orders.
 * Role: SUPPLY_COORDINATOR
 *
 * Routes:
 *   GET  /api/coordinator/orders                          – list orders (filter by status)
 *   GET  /api/coordinator/orders/summary                  – aggregate demand across all stores
 *   PUT  /api/coordinator/orders/{id}/confirm             – SUBMITTED → CONFIRMED
 *   PUT  /api/coordinator/orders/{id}/reject              – SUBMITTED → REJECTED
 *   PUT  /api/coordinator/orders/{id}/cancel              – CONFIRMED → CANCELLED
 *   PUT  /api/coordinator/orders/{id}/adjust-quantities   – adjust approved quantities (thiếu hàng)
 */
class CoordinatorOrderController extends Controller
{
    private function ensureCoordinator(Request $request): void
    {
        $user     = $request->user();
        $roleCode = $user?->role?->code;

        if (!in_array($roleCode, ['SUPPLY_COORDINATOR', 'MANAGER', 'ADMIN'])) {
            abort(response()->json([
                'success' => false,
                'message' => 'Bạn không có quyền thực hiện hành động này (cần vai trò Coordinator hoặc cao hơn)',
            ], 403));
        }
    }

    // ------------------------------------------------------------------
    // GET /api/coordinator/orders
    // ------------------------------------------------------------------
    public function index(Request $request)
    {
        $this->ensureCoordinator($request);

        $query = Order::with(['store', 'items.item', 'creator', 'approver', 'confirmedBy']);

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('store_id')) {
            $query->where('store_id', $request->store_id);
        }

        if ($request->filled('date_from')) {
            $query->whereDate('order_date', '>=', $request->date_from);
        }

        if ($request->filled('date_to')) {
            $query->whereDate('order_date', '<=', $request->date_to);
        }

        $orders = $query
            ->orderByDesc('order_date')
            ->orderByDesc('id')
            ->paginate($request->get('per_page', 20));

        return response()->json([
            'success' => true,
            'data'    => $orders,
        ]);
    }

    // ------------------------------------------------------------------
    // GET /api/coordinator/orders/summary
    // Aggregate total demand from all stores for a date range / status set.
    // ------------------------------------------------------------------
    public function summary(Request $request)
    {
        $this->ensureCoordinator($request);

        // Statuses to include in the summary (default: SUBMITTED + CONFIRMED)
        $statuses = $request->filled('statuses')
            ? explode(',', $request->statuses)
            : [Order::STATUS_SUBMITTED, Order::STATUS_CONFIRMED];

        $query = Order::with(['store', 'items.item'])
            ->whereIn('status', $statuses);

        if ($request->filled('date_from')) {
            $query->whereDate('order_date', '>=', $request->date_from);
        }

        if ($request->filled('date_to')) {
            $query->whereDate('order_date', '<=', $request->date_to);
        }

        $orders = $query->get();

        // ---- Per-store summary ----
        $byStore = $orders->groupBy('store_id')->map(function ($storeOrders) {
            $store = $storeOrders->first()->store;
            return [
                'store_id'    => $store?->id,
                'store_code'  => $store?->code,
                'store_name'  => $store?->name,
                'order_count' => $storeOrders->count(),
                'statuses'    => $storeOrders->pluck('status')->countBy()->toArray(),
                'orders'      => $storeOrders->map(fn($o) => [
                    'id'            => $o->id,
                    'order_code'    => $o->order_code,
                    'status'        => $o->status,
                    'order_date'    => $o->order_date,
                    'required_date' => $o->required_date,
                    'items_count'   => $o->items->count(),
                ])->values(),
            ];
        })->values();

        // ---- Per-item aggregate (total demand) ----
        $itemTotals = [];
        foreach ($orders as $order) {
            foreach ($order->items as $oi) {
                $itemId = $oi->item_id;
                if (!isset($itemTotals[$itemId])) {
                    $itemTotals[$itemId] = [
                        'item_id'          => $itemId,
                        'item_code'        => $oi->item?->code,
                        'item_name'        => $oi->item?->name,
                        'unit'             => $oi->unit,
                        'total_ordered'    => 0,
                        'total_approved'   => 0,
                        'store_breakdown'  => [],
                    ];
                }
                $itemTotals[$itemId]['total_ordered']  += (float) $oi->ordered_quantity;
                $itemTotals[$itemId]['total_approved']  += (float) ($oi->approved_quantity ?? $oi->ordered_quantity);
                $storeCode = $order->store?->code ?? 'N/A';
                if (!isset($itemTotals[$itemId]['store_breakdown'][$storeCode])) {
                    $itemTotals[$itemId]['store_breakdown'][$storeCode] = 0;
                }
                $itemTotals[$itemId]['store_breakdown'][$storeCode] += (float) $oi->ordered_quantity;
            }
        }

        // Convert store_breakdown maps to arrays
        $itemList = array_values(array_map(function ($row) {
            $row['store_breakdown'] = array_map(
                fn($qty, $code) => ['store_code' => $code, 'quantity' => $qty],
                $row['store_breakdown'],
                array_keys($row['store_breakdown'])
            );
            return $row;
        }, $itemTotals));

        // Sort items by total_ordered desc
        usort($itemList, fn($a, $b) => $b['total_ordered'] <=> $a['total_ordered']);

        return response()->json([
            'success' => true,
            'data'    => [
                'total_orders' => $orders->count(),
                'total_stores' => $byStore->count(),
                'statuses'     => $orders->pluck('status')->countBy()->toArray(),
                'by_store'     => $byStore,
                'by_item'      => $itemList,
            ],
        ]);
    }

    // ------------------------------------------------------------------
    // PUT /api/coordinator/orders/{id}/confirm
    // Transition: SUBMITTED → CONFIRMED
    // ------------------------------------------------------------------
    public function confirm(Request $request, int $id)
    {
        $this->ensureCoordinator($request);

        $order = Order::with('items')->findOrFail($id);

        if (!$order->canTransitionTo(Order::STATUS_CONFIRMED)) {
            return response()->json([
                'success' => false,
                'message' => "Không thể xác nhận đơn ở trạng thái '{$order->status}'. Đơn phải ở trạng thái SUBMITTED.",
            ], 422);
        }

        $validated = $request->validate([
            'note' => 'nullable|string|max:1000',
        ]);

        $order->status       = Order::STATUS_CONFIRMED;
        $order->confirmed_by = $request->user()->id;
        $order->confirmed_at = now();
        if (!empty($validated['note'])) {
            $order->note = $validated['note'];
        }
        $order->save();

        // Gửi notification async cho store staff
        SendOrderNotification::dispatch($order, 'status_changed', Order::STATUS_CONFIRMED);

        return response()->json([
            'success' => true,
            'message' => 'Đã xác nhận đơn hàng thành công',
            'data'    => $order->fresh(['store', 'items.item', 'creator', 'approver', 'confirmedBy']),
        ]);
    }

    // ------------------------------------------------------------------
    // PUT /api/coordinator/orders/{id}/reject
    // Transition: SUBMITTED → REJECTED
    // ------------------------------------------------------------------
    public function reject(Request $request, int $id)
    {
        $this->ensureCoordinator($request);

        $order = Order::with('items')->findOrFail($id);

        if (!$order->canTransitionTo(Order::STATUS_REJECTED)) {
            return response()->json([
                'success' => false,
                'message' => "Không thể từ chối đơn ở trạng thái '{$order->status}'. Đơn phải ở trạng thái SUBMITTED.",
            ], 422);
        }

        $validated = $request->validate([
            'cancel_reason' => 'nullable|string|max:1000',
        ]);

        $order->status        = Order::STATUS_REJECTED;
        $order->confirmed_by  = $request->user()->id;
        $order->confirmed_at  = now();
        $order->cancel_reason = $validated['cancel_reason'] ?? null;
        $order->save();

        // Gửi notification async cho store staff
        SendOrderNotification::dispatch($order, 'status_changed', Order::STATUS_REJECTED);

        return response()->json([
            'success' => true,
            'message' => 'Đã từ chối đơn hàng',
            'data'    => $order->fresh(['store', 'items.item', 'creator', 'approver', 'confirmedBy']),
        ]);
    }

    // ------------------------------------------------------------------
    // PUT /api/coordinator/orders/{id}/cancel
    // Transition: CONFIRMED → CANCELLED  (coordinator can cancel a confirmed order)
    // ------------------------------------------------------------------
    public function cancel(Request $request, int $id)
    {
        $this->ensureCoordinator($request);

        $order = Order::findOrFail($id);

        if (!$order->canTransitionTo(Order::STATUS_CANCELLED)) {
            return response()->json([
                'success' => false,
                'message' => "Không thể hủy đơn ở trạng thái '{$order->status}'.",
            ], 422);
        }

        $validated = $request->validate([
            'cancel_reason' => 'nullable|string|max:1000',
        ]);

        $order->status        = Order::STATUS_CANCELLED;
        $order->cancel_reason = $validated['cancel_reason'] ?? null;
        $order->save();

        // Gửi notification async cho store staff
        SendOrderNotification::dispatch($order, 'status_changed', Order::STATUS_CANCELLED);

        return response()->json([
            'success' => true,
            'message' => 'Đã hủy đơn hàng',
            'data'    => $order->fresh(['store', 'items.item', 'creator', 'confirmedBy']),
        ]);
    }

    // ------------------------------------------------------------------
    // PUT /api/coordinator/orders/{id}/adjust-quantities
    // Adjust approved_quantity per item (handle stock shortage)
    // Only on SUBMITTED orders (before confirm).
    // ------------------------------------------------------------------
    public function adjustQuantities(Request $request, int $id)
    {
        $this->ensureCoordinator($request);

        $order = Order::with('items.item')->findOrFail($id);

        if (!in_array($order->status, [Order::STATUS_SUBMITTED, Order::STATUS_CONFIRMED])) {
            return response()->json([
                'success' => false,
                'message' => "Chỉ có thể điều chỉnh số lượng đơn ở trạng thái SUBMITTED hoặc CONFIRMED.",
            ], 422);
        }

        $validated = $request->validate([
            'items'                    => 'required|array|min:1',
            'items.*.order_item_id'    => 'required|integer',
            'items.*.approved_quantity'=> 'required|numeric|min:0',
            'note'                     => 'nullable|string|max:1000',
        ]);

        DB::transaction(function () use ($order, $validated) {
            foreach ($validated['items'] as $row) {
                /** @var \App\Models\OrderItem|null $oi */
                $oi = OrderItem::where('order_id', $order->id)
                    ->where('id', $row['order_item_id'])
                    ->first();
                if ($oi) {
                    $oi->approved_quantity = $row['approved_quantity'];
                    $oi->save();
                }
            }
            if (!empty($validated['note'])) {
                $order->note = $validated['note'];
                $order->save();
            }
        });

        return response()->json([
            'success' => true,
            'message' => 'Đã điều chỉnh số lượng phê duyệt',
            'data'    => $order->fresh(['store', 'items.item', 'creator', 'confirmedBy']),
        ]);
    }
}
