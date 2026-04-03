<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use Illuminate\Http\Request;

class ManagerOrderController extends Controller
{
    protected function ensureManagerOrAdmin(Request $request): void
    {
        $user = $request->user();
        $code = $user?->role?->code;
        if (!in_array($code, ['MANAGER', 'ADMIN'], true)) {
            abort(response()->json([
                'success' => false,
                'message' => 'Bạn không có quyền truy cập chức năng này',
            ], 403));
        }
    }

    public function index(Request $request)
    {
        $this->ensureManagerOrAdmin($request);

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
            'data' => $orders,
        ]);
    }
}
