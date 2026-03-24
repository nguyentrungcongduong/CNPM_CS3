<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ProductionPlan;
use App\Models\ProductionPlanItem;
use App\Models\Order;
use App\Services\ProductionService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class KitchenProductionController extends Controller
{
    protected $productionService;

    public function __construct(ProductionService $productionService)
    {
        $this->productionService = $productionService;
    }

    private function ensureKitchenOrAdmin(Request $request): void
    {
        $user = $request->user();
        $roleCode = $user?->role?->code;

        if (!in_array($roleCode, ['KITCHEN_STAFF', 'CENTRAL_KITCHEN_STAFF', 'ADMIN'])) {
            abort(response()->json([
                'success' => false,
                'message' => 'Bạn không có quyền thực hiện hành động này (cần vai trò Kitchen Staff hoặc Admin)',
            ], 403));
        }
    }

    /**
     * Get list of production plans
     */
    public function index(Request $request)
    {
        $this->ensureKitchenOrAdmin($request);

        $plans = ProductionPlan::with(['items.item', 'creator', 'orders.store'])
            ->orderByDesc('created_at')
            ->paginate($request->get('per_page', 15));

        return response()->json([
            'success' => true,
            'data' => $plans
        ]);
    }

    /**
     * API POST /api/kitchen/production-plan
     * Generate or create a production plan
     */
    public function store(Request $request)
    {
        $this->ensureKitchenOrAdmin($request);

        $request->validate([
            'plan_date' => 'required|date',
            'order_id'  => 'nullable|exists:orders,id',
            // It could receive items array or just generate based on date
            'items' => 'nullable|array',
            'items.*.item_id' => 'required|exists:items,id',
            'items.*.quantity' => 'required|numeric|min:0.01',
        ]);

        $date = $request->plan_date;

        try {
            DB::beginTransaction();

            // If items are not provided, we aggregate from CONFIRMED orders
            $aggregatedData = null;
            if ($request->filled('order_id')) {
                $order = Order::with(['items.item', 'store'])
                    ->findOrFail($request->order_id);

                if ($order->status !== 'APPROVED') {
                    return response()->json([
                        'success' => false,
                        'message' => "Không thể tạo kế hoạch sản xuất: đơn hàng chưa được duyệt (trạng thái hiện tại: '{$order->status}').",
                    ], 422);
                }

                if (!empty($order->production_plan_id)) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Đơn hàng này đã được gán vào một kế hoạch sản xuất trước đó.',
                    ], 422);
                }

                $itemsToProduce = $order->items->map(function ($oi) {
                    $qty = $oi->approved_quantity ?? $oi->ordered_quantity;
                    return [
                        'item_id' => $oi->item_id,
                        'quantity' => (float) $qty,
                    ];
                })->values()->toArray();
            } elseif (!$request->items) {
                $aggregatedData = $this->productionService->aggregateOrders($date);
                $itemsToProduce = array_map(function($agg) {
                    return [
                        'item_id' => $agg['item']->id,
                        'quantity' => $agg['total_quantity'],
                    ];
                }, $aggregatedData['aggregated_items']);
            } else {
                $itemsToProduce = $request->items;
            }

            if (empty($itemsToProduce)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Không có yêu cầu sản xuất nào cho ngày này.'
                ], 400);
            }

            // Create plan
            $plan = ProductionPlan::create([
                'plan_code' => 'PP-' . date('YmdHis') . '-' . rand(100, 999),
                'plan_date' => $date,
                'status' => 'PENDING',
                'created_by' => request()->user()->id,
            ]);

            foreach ($itemsToProduce as $prodItem) {
                ProductionPlanItem::create([
                    'production_plan_id' => $plan->id,
                    'item_id' => $prodItem['item_id'],
                    'planned_quantity' => $prodItem['quantity'],
                    'unit' => \App\Models\Item::find($prodItem['item_id'])->unit ?? 'unit',
                ]);
            }

            // Update orders to associate with this production plan
            if ($request->filled('order_id')) {
                Order::where('id', $request->order_id)->update(['production_plan_id' => $plan->id]);
            } elseif ($aggregatedData && isset($aggregatedData['orders'])) {
                foreach ($aggregatedData['orders'] as $order) {
                    $order->update(['production_plan_id' => $plan->id]);
                }
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Tạo kế hoạch sản xuất thành công.',
                'data' => $plan->load(['items.item', 'orders.store'])
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Lỗi: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Check ingredients needed for a plan
     */
    public function checkIngredients($id)
    {
        $this->ensureKitchenOrAdmin(request());

        $plan = ProductionPlan::with('items')->findOrFail($id);
        
        $itemsToProduce = [];
        foreach ($plan->items as $item) {
            $itemsToProduce[] = [
                'item_id' => $item->item_id,
                'quantity' => $item->planned_quantity,
            ];
        }

        $ingredients = $this->productionService->calculateIngredients($itemsToProduce);

        return response()->json([
            'success' => true,
            'data' => $ingredients
        ]);
    }

    /**
     * API PUT /api/kitchen/production/{id}/status
     * Update production plan status (e.g., PENDING -> IN_PROGRESS -> COMPLETED)
     */
    public function updateStatus(Request $request, $id)
    {
        $this->ensureKitchenOrAdmin($request);

        $request->validate([
            'status' => 'required|in:PENDING,IN_PROGRESS,COMPLETED,CANCELLED',
        ]);

        $plan = ProductionPlan::with('orders')->findOrFail($id);
        $targetStatus = $request->status;

        DB::transaction(function () use ($plan, $targetStatus) {
            $plan->update([
                'status' => $targetStatus,
            ]);

            // Sync linked order statuses with production lifecycle.
            // NOTE: Never move orders to COMPLETED from production stage.
            if ($targetStatus === 'IN_PROGRESS') {
                Order::query()
                    ->where('production_plan_id', $plan->id)
                    ->whereIn('status', [
                        Order::STATUS_SUBMITTED,
                        Order::STATUS_CONFIRMED,
                        'APPROVED', // legacy
                    ])
                    ->update([
                        'status' => Order::STATUS_IN_PRODUCTION,
                        'production_started_at' => now(),
                    ]);
            }

            if ($targetStatus === 'COMPLETED') {
                Order::query()
                    ->where('production_plan_id', $plan->id)
                    ->whereIn('status', [
                        Order::STATUS_IN_PRODUCTION,
                        Order::STATUS_CONFIRMED,
                        'APPROVED', // legacy fallback
                    ])
                    ->update([
                        // No READY_FOR_DELIVERY status in current model; use IN_DELIVERY.
                        'status' => Order::STATUS_IN_DELIVERY,
                        'ready_at' => now(),
                        'in_delivery_at' => now(),
                    ]);
            }
        });

        return response()->json([
            'success' => true,
            'message' => 'Cập nhật trạng thái thành công.',
            'data' => $plan->fresh(['orders'])
        ]);
    }

    /**
     * DELETE /api/kitchen/production-plan/{id}
     * Allow deletion when status = PENDING or COMPLETED.
     */
    public function destroy(Request $request, int $id)
    {
        $this->ensureKitchenOrAdmin($request);

        $plan = ProductionPlan::with('items')->findOrFail($id);

        if (!in_array($plan->status, ['PENDING', 'COMPLETED'])) {
            return response()->json([
                'success' => false,
                'message' => "Không thể xóa kế hoạch ở trạng thái '{$plan->status}'. Chỉ cho phép xóa khi PENDING hoặc COMPLETED.",
            ], 422);
        }

        DB::transaction(function () use ($plan) {
            ProductionPlanItem::where('production_plan_id', $plan->id)->delete();
            // Hard delete to trigger FK nullOnDelete on orders.production_plan_id
            $plan->forceDelete();
        });

        return response()->json([
            'success' => true,
            'message' => 'Đã xóa kế hoạch sản xuất thành công.',
        ]);
    }
}
