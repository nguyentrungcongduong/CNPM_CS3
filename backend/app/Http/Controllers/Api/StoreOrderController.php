<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\OrderItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class StoreOrderController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        if (!$user->store_id) {
            return response()->json([
                'success' => false,
                'message' => 'Người dùng không thuộc cửa hàng nào',
            ], 403);
        }

        $query = Order::with(['items.item', 'store'])
            ->where('store_id', $user->store_id);

        if ($request->filled('status')) {
            $query->where('status', $request->status);
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

    public function store(Request $request)
    {
        $user = $request->user();

        if (!$user->store_id) {
            return response()->json([
                'success' => false,
                'message' => 'Người dùng không thuộc cửa hàng nào',
            ], 403);
        }

        $validated = $request->validate([
            'required_date' => 'required|date',
            'note' => 'nullable|string',
            'warehouse_id' => 'nullable|exists:warehouses,id',
            'items' => 'required|array|min:1',
            'items.*.item_id' => 'required|exists:items,id',
            'items.*.ordered_quantity' => 'required|numeric|min:0.001',
            'items.*.unit' => 'required|string|max:50',
            'items.*.note' => 'nullable|string',
        ]);

        $order = DB::transaction(function () use ($validated, $user) {
            $orderCode = 'SO-' . strtoupper(Str::random(6)) . '-' . now()->format('ymdHis');

            $order = Order::create([
                'order_code' => $orderCode,
                'store_id' => $user->store_id,
                'warehouse_id' => $validated['warehouse_id'] ?? null,
                'created_by' => $user->id,
                'status' => 'PENDING',
                'order_date' => now(),
                'required_date' => $validated['required_date'],
                'note' => $validated['note'] ?? null,
            ]);

            $itemsPayload = $validated['items'] ?? [];

            foreach ($itemsPayload as $item) {
                OrderItem::create([
                    'order_id' => $order->id,
                    'item_id' => $item['item_id'],
                    'ordered_quantity' => $item['ordered_quantity'],
                    'approved_quantity' => null,
                    'delivered_quantity' => null,
                    'unit' => $item['unit'],
                    'note' => $item['note'] ?? null,
                ]);
            }

            return $order->load(['items.item', 'store']);
        });

        return response()->json([
            'success' => true,
            'message' => 'Tạo đơn đặt hàng thành công',
            'data' => $order,
        ], 201);
    }

    public function show(Request $request, int $id)
    {
        $user = $request->user();

        if (!$user->store_id) {
            return response()->json([
                'success' => false,
                'message' => 'Người dùng không thuộc cửa hàng nào',
            ], 403);
        }

        $order = Order::with(['items.item', 'store'])
            ->where('store_id', $user->store_id)
            ->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $order,
        ]);
    }
}

