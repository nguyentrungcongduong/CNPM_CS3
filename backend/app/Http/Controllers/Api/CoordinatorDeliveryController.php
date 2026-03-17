<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Delivery;
use App\Models\Order;
use App\Services\DeliveryService;
use Illuminate\Http\Request;

/**
 * CoordinatorDeliveryController
 *
 * Quản lý lịch giao hàng dành cho Supply Coordinator.
 *
 * Routes:
 *   GET    /api/coordinator/deliveries                 – danh sách lịch giao
 *   POST   /api/coordinator/deliveries                 – tạo lịch + gán đơn (assignDelivery)
 *   GET    /api/coordinator/deliveries/{id}            – chi tiết lịch giao
 *   PATCH  /api/coordinator/deliveries/{id}/status     – cập nhật trạng thái
 *   GET    /api/coordinator/orders/ready               – danh sách đơn READY (chờ lên lịch)
 */
class CoordinatorDeliveryController extends Controller
{
    public function __construct(private DeliveryService $deliveryService)
    {
    }

    private function ensureCoordinator(Request $request): void
    {
        $roleCode = $request->user()?->role?->code;
        if (!in_array($roleCode, ['SUPPLY_COORDINATOR', 'MANAGER', 'ADMIN'])) {
            abort(response()->json([
                'success' => false,
                'message' => 'Bạn không có quyền thực hiện hành động này.',
            ], 403));
        }
    }

    // ------------------------------------------------------------------
    // GET /api/coordinator/orders/ready
    // Các đơn hàng trạng thái READY (bếp đã xong) – chờ lên lịch giao
    // ------------------------------------------------------------------
    public function readyOrders(Request $request)
    {
        $this->ensureCoordinator($request);

        $orders = Order::with(['store', 'items.item'])
            ->where('status', Order::STATUS_READY)
            ->orderByDesc('ready_at')
            ->orderByDesc('id')
            ->get();

        return response()->json([
            'success' => true,
            'data'    => $orders,
        ]);
    }

    // ------------------------------------------------------------------
    // GET /api/coordinator/deliveries
    // ------------------------------------------------------------------
    public function index(Request $request)
    {
        $this->ensureCoordinator($request);

        $query = Delivery::with(['items.order.store', 'assignedBy']);

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('date_from')) {
            $query->whereDate('scheduled_date', '>=', $request->date_from);
        }

        if ($request->filled('date_to')) {
            $query->whereDate('scheduled_date', '<=', $request->date_to);
        }

        $deliveries = $query
            ->orderByDesc('scheduled_date')
            ->orderByDesc('id')
            ->paginate($request->get('per_page', 20));

        return response()->json([
            'success' => true,
            'data'    => $deliveries,
        ]);
    }

    // ------------------------------------------------------------------
    // POST /api/coordinator/deliveries
    // Body: { scheduled_date, scheduled_time?, driver_name?, driver_phone?,
    //         vehicle_plate?, note?, order_ids: [] }
    // ------------------------------------------------------------------
    public function store(Request $request)
    {
        $this->ensureCoordinator($request);

        $validated = $request->validate([
            'scheduled_date' => 'required|date',
            'scheduled_time' => 'nullable|date_format:H:i',
            'driver_name'    => 'nullable|string|max:255',
            'driver_phone'   => 'nullable|string|max:50',
            'vehicle_plate'  => 'nullable|string|max:50',
            'note'           => 'nullable|string|max:1000',
            'order_ids'      => 'required|array|min:1',
            'order_ids.*'    => 'required|integer|exists:orders,id',
        ]);

        $delivery = $this->deliveryService->assignDelivery($validated, $request->user()->id);

        return response()->json([
            'success' => true,
            'message' => "Đã tạo lịch giao hàng {$delivery->delivery_code}",
            'data'    => $delivery,
        ], 201);
    }

    // ------------------------------------------------------------------
    // GET /api/coordinator/deliveries/{id}
    // ------------------------------------------------------------------
    public function show(Request $request, int $id)
    {
        $this->ensureCoordinator($request);

        $delivery = Delivery::with(['items.order.store.items', 'assignedBy'])->findOrFail($id);

        return response()->json([
            'success' => true,
            'data'    => $delivery,
        ]);
    }

    // ------------------------------------------------------------------
    // PATCH /api/coordinator/deliveries/{id}/status
    // Body: { status: 'IN_TRANSIT' | 'DELIVERED' | 'CANCELLED', note? }
    // ------------------------------------------------------------------
    public function updateStatus(Request $request, int $id)
    {
        $this->ensureCoordinator($request);

        $validated = $request->validate([
            'status' => 'required|in:IN_TRANSIT,DELIVERED,CANCELLED',
            'note'   => 'nullable|string|max:1000',
        ]);

        $delivery = Delivery::findOrFail($id);
        $delivery = $this->deliveryService->updateStatus(
            $delivery,
            $validated['status'],
            $validated['note'] ?? null
        );

        return response()->json([
            'success' => true,
            'message' => "Đã cập nhật lịch giao sang trạng thái '{$validated['status']}'",
            'data'    => $delivery,
        ]);
    }
}
