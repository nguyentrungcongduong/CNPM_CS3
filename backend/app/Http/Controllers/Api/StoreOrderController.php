<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Jobs\SendOrderNotification;
use App\Models\Item;
use App\Models\Order;
use App\Models\OrderItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Validator;

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

        $normalizedPayload = $this->normalizeStoreOrderPayload($request);

        $validator = Validator::make($normalizedPayload, [
            'required_date' => 'required|date',
            'note' => 'nullable|string',
            'warehouse_id' => 'nullable|exists:warehouses,id',
            'items' => 'required|array|min:1',
            'items.*.item_id' => 'required|exists:items,id',
            'items.*.ordered_quantity' => 'required|numeric|min:0.001',
            'items.*.unit' => 'required|string|max:50',
            'items.*.note' => 'nullable|string',
        ], [
            'required_date.required' => 'required_date là bắt buộc (hoặc dùng aliases: requested_date/date).',
            'items.*.item_id.required' => 'Mỗi dòng items phải có item_id (hoặc item_code hợp lệ).',
            'items.*.unit.required' => 'Mỗi dòng items phải có unit.',
        ]);

        $validated = $validator->validate();

        $order = DB::transaction(function () use ($validated, $user) {
            $orderCode = 'SO-' . strtoupper(Str::random(6)) . '-' . now()->format('ymdHis');

            $order = Order::create([
                'order_code' => $orderCode,
                'store_id' => $user->store_id,
                'warehouse_id' => $validated['warehouse_id'] ?? null,
                'created_by' => $user->id,
                'status' => Order::STATUS_DRAFT,
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

    /**
     * Normalize payload aliases so invalid/mismatched payloads are validated as 422.
     * Supported aliases:
     * - required_date <- requested_date | date
     * - items.*.item_id <- item_code
     */
    private function normalizeStoreOrderPayload(Request $request): array
    {
        $payload = $request->all();

        if (!array_key_exists('required_date', $payload)) {
            $payload['required_date'] = $payload['requested_date'] ?? ($payload['date'] ?? null);
        }

        $items = is_array($payload['items'] ?? null) ? $payload['items'] : [];

        $itemCodes = collect($items)
            ->pluck('item_code')
            ->filter(fn($code) => is_string($code) && trim($code) !== '')
            ->map(fn($code) => trim($code))
            ->unique()
            ->values();

        $itemCodeMap = [];
        if ($itemCodes->isNotEmpty()) {
            $itemCodeMap = Item::query()
                ->whereIn('code', $itemCodes->all())
                ->pluck('id', 'code')
                ->toArray();
        }

        $payload['items'] = array_map(function ($row) use ($itemCodeMap) {
            if (!is_array($row)) {
                return [];
            }

            if (!isset($row['item_id']) && !empty($row['item_code'])) {
                $code = trim((string) $row['item_code']);
                if (isset($itemCodeMap[$code])) {
                    $row['item_id'] = $itemCodeMap[$code];
                }
            }

            return [
                'item_id' => $row['item_id'] ?? null,
                'ordered_quantity' => $row['ordered_quantity'] ?? null,
                'unit' => $row['unit'] ?? null,
                'note' => $row['note'] ?? ($row['item_note'] ?? null),
            ];
        }, $items);

        return $payload;
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

        $order = Order::with([
            'items.item',
            'store',
            'statusHistories' => function ($query) {
                $query->orderBy('created_at', 'asc');
            },
            'statusHistories.changedBy:id,full_name'
        ])
            ->where('store_id', $user->store_id)
            ->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $order,
        ]);
    }

    /**
     * PUT /api/store/orders/{id}/submit
     * Chuyển trạng thái DRAFT → SUBMITTED và báo cho Coordinator
     */
    public function submit(Request $request, int $id)
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

        if ($order->status !== Order::STATUS_DRAFT) {
            return response()->json([
                'success' => false,
                'message' => "Chỉ có thể gửi đơn ở trạng thái DRAFT.",
            ], 422);
        }

        $order->status = Order::STATUS_SUBMITTED;
        $order->save();

        // Gửi notification cần thông báo cho Coordinator về đơn mới
        SendOrderNotification::dispatch($order, 'new_order');

        return response()->json([
            'success' => true,
            'message' => 'Đã gửi đơn hàng thành công',
            'data'    => $order->fresh(['store', 'items.item']),
        ]);
    }

    /**
     * PUT /api/store/orders/{id}/cancel
     * Hủy đơn (DRAFT hoặc SUBMITTED)
     */
    public function cancel(Request $request, int $id)
    {
        $user = $request->user();

        if (!$user->store_id) {
            return response()->json([
                'success' => false,
                'message' => 'Người dùng không thuộc cửa hàng nào',
            ], 403);
        }

        $order = Order::where('store_id', $user->store_id)->findOrFail($id);

        if (!in_array($order->status, [Order::STATUS_DRAFT, Order::STATUS_SUBMITTED])) {
            return response()->json([
                'success' => false,
                'message' => 'Chỉ có thể hủy đơn ở trạng thái DRAFT hoặc SUBMITTED.',
            ], 422);
        }

        $validated = $request->validate([
            'cancel_reason' => 'nullable|string|max:500',
        ]);

        $order->status        = Order::STATUS_CANCELLED;
        $order->cancel_reason = $validated['cancel_reason'] ?? null;
        $order->save();

        return response()->json([
            'success' => true,
            'message' => 'Đã hủy đơn hàng',
            'data'    => $order->fresh(['store', 'items.item']),
        ]);
    }
}
