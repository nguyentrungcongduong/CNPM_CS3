<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use Illuminate\Http\Request;

/**
 * CoordinatorOrderController
 *
 * Handles Supply Coordinator actions on orders.
 * Role: SUPPLY_COORDINATOR
 *
 * Routes:
 *   GET  /api/coordinator/orders          – list orders (filter by status)
 *   PUT  /api/coordinator/orders/{id}/confirm – confirm a SUBMITTED order → CONFIRMED
 *   PUT  /api/coordinator/orders/{id}/reject  – reject a SUBMITTED order  → REJECTED
 */
class CoordinatorOrderController extends Controller
{
    private function ensureCoordinator(Request $request): void
    {
        $user = $request->user();
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

        return response()->json([
            'success' => true,
            'message' => 'Đã từ chối đơn hàng',
            'data'    => $order->fresh(['store', 'items.item', 'creator', 'approver', 'confirmedBy']),
        ]);
    }
}
