<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use Illuminate\Http\Request;

class ManagerOrderController extends Controller
{
    protected function ensureManager(Request $request): void
    {
        $user = $request->user();
        if (!$user || !$user->role || $user->role->code !== 'MANAGER') {
            abort(response()->json([
                'success' => false,
                'message' => 'Bạn không có quyền truy cập chức năng này',
            ], 403));
        }
    }

    public function index(Request $request)
    {
        $this->ensureManager($request);

        $query = Order::with(['store', 'items.item', 'creator', 'approver']);

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
            'data' => $orders,
        ]);
    }

    public function approve(Request $request, int $id)
    {
        $this->ensureManager($request);

        $order = Order::with('items')->findOrFail($id);

        if ($order->status !== 'PENDING') {
            return response()->json([
                'success' => false,
                'message' => 'Chỉ có thể duyệt đơn ở trạng thái PENDING',
            ], 422);
        }

        $order->status = 'APPROVED';
        $order->approved_by = $request->user()->id;
        $order->save();

        return response()->json([
            'success' => true,
            'message' => 'Đã duyệt đơn hàng thành công',
            'data' => $order->fresh(['store', 'items.item', 'creator', 'approver']),
        ]);
    }

    public function reject(Request $request, int $id)
    {
        $this->ensureManager($request);

        $order = Order::with('items')->findOrFail($id);

        if ($order->status !== 'PENDING') {
            return response()->json([
                'success' => false,
                'message' => 'Chỉ có thể từ chối đơn ở trạng thái PENDING',
            ], 422);
        }

        $validated = $request->validate([
            'cancel_reason' => 'nullable|string|max:1000',
        ]);

        $order->status = 'REJECTED';
        $order->approved_by = $request->user()->id;
        $order->cancel_reason = $validated['cancel_reason'] ?? null;
        $order->save();

        return response()->json([
            'success' => true,
            'message' => 'Đã từ chối đơn hàng',
            'data' => $order->fresh(['store', 'items.item', 'creator', 'approver']),
        ]);
    }
}

