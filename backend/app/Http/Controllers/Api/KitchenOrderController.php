<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use Illuminate\Http\Request;

/**
 * KitchenOrderController
 *
 * Handles Kitchen Staff actions on orders during the production lifecycle.
 * Role: CENTRAL_KITCHEN_STAFF (also accessible by MANAGER / ADMIN)
 *
 * Routes:
 *   GET  /api/kitchen/orders                    – list orders relevant to kitchen
 *   GET  /api/kitchen/orders/{id}               – get single order detail
 *   PUT  /api/kitchen/orders/{id}/status        – advance kitchen status
 *
 * Kitchen-controlled statuses:
 *   CONFIRMED   → IN_PRODUCTION  (kitchen acknowledges and starts production)
 *   IN_PRODUCTION → READY        (production complete, ready to ship)
 *   READY       → IN_DELIVERY    (handed to delivery driver)
 *   IN_DELIVERY → DELIVERED      (delivered to store)
 *   DELIVERED   → COMPLETED      (store confirmed receipt)
 */
class KitchenOrderController extends Controller
{
    /** Allowed values the kitchen can push to via this endpoint */
    const KITCHEN_PUSHABLE_STATUSES = [
        Order::STATUS_IN_PRODUCTION,
        Order::STATUS_READY,
        Order::STATUS_IN_DELIVERY,
        Order::STATUS_DELIVERED,
        Order::STATUS_COMPLETED,
    ];

    private function ensureKitchenOrAbove(Request $request): void
    {
        $user = $request->user();
        $roleCode = $user?->role?->code;

        if (!in_array($roleCode, ['CENTRAL_KITCHEN_STAFF', 'SUPPLY_COORDINATOR', 'MANAGER', 'ADMIN'])) {
            abort(response()->json([
                'success' => false,
                'message' => 'Bạn không có quyền thực hiện hành động này (cần vai trò Kitchen Staff hoặc cao hơn)',
            ], 403));
        }
    }

    // ------------------------------------------------------------------
    // GET /api/kitchen/orders
    // ------------------------------------------------------------------
    public function index(Request $request)
    {
        $this->ensureKitchenOrAbove($request);

        $query = Order::with(['store', 'items.item', 'creator', 'confirmedBy']);

        // Default: show orders that are in the kitchen lifecycle
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        } else {
            // Show all non-terminal, non-draft, non-submitted states by default
            $query->whereIn('status', [
                Order::STATUS_CONFIRMED,
                Order::STATUS_IN_PRODUCTION,
                Order::STATUS_READY,
                Order::STATUS_IN_DELIVERY,
                Order::STATUS_DELIVERED,
            ]);
        }

        if ($request->filled('store_id')) {
            $query->where('store_id', $request->store_id);
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
    // GET /api/kitchen/orders/{id}
    // ------------------------------------------------------------------
    public function show(Request $request, int $id)
    {
        $this->ensureKitchenOrAbove($request);

        $order = Order::with(['store', 'items.item', 'creator', 'approver', 'confirmedBy'])
            ->findOrFail($id);

        return response()->json([
            'success' => true,
            'data'    => $order,
        ]);
    }

    // ------------------------------------------------------------------
    // PUT /api/kitchen/orders/{id}/status
    //
    // Body: { "status": "IN_PRODUCTION" | "READY" | "IN_DELIVERY" | "DELIVERED" | "COMPLETED" }
    // ------------------------------------------------------------------
    public function updateStatus(Request $request, int $id)
    {
        $this->ensureKitchenOrAbove($request);

        $validated = $request->validate([
            'status' => 'required|string|in:' . implode(',', self::KITCHEN_PUSHABLE_STATUSES),
            'note'   => 'nullable|string|max:1000',
        ]);

        $newStatus = $validated['status'];
        $order = Order::with('items')->findOrFail($id);

        if (!$order->canTransitionTo($newStatus)) {
            return response()->json([
                'success' => false,
                'message' => "Không thể chuyển trạng thái từ '{$order->status}' sang '{$newStatus}'. Luồng hợp lệ: "
                    . implode(' → ', Order::ALLOWED_TRANSITIONS[$order->status] ?? []),
            ], 422);
        }

        // Apply status
        $order->status = $newStatus;

        // Record timestamp for each stage
        $now = now();
        switch ($newStatus) {
            case Order::STATUS_IN_PRODUCTION:
                $order->production_started_at = $now;
                break;
            case Order::STATUS_READY:
                $order->ready_at = $now;
                break;
            case Order::STATUS_IN_DELIVERY:
                $order->in_delivery_at = $now;
                break;
            case Order::STATUS_DELIVERED:
                $order->delivered_at = $now;
                break;
            case Order::STATUS_COMPLETED:
                $order->completed_at = $now;
                break;
        }

        if (!empty($validated['note'])) {
            $order->note = $validated['note'];
        }

        $order->save();

        return response()->json([
            'success' => true,
            'message' => "Đã cập nhật trạng thái đơn hàng sang '{$newStatus}'",
            'data'    => $order->fresh(['store', 'items.item', 'creator', 'approver', 'confirmedBy']),
        ]);
    }
}
