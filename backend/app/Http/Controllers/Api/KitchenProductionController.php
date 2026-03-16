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

    /**
     * Get list of production plans
     */
    public function index(Request $request)
    {
        $plans = ProductionPlan::with(['items.item', 'creator'])
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
        $request->validate([
            'plan_date' => 'required|date',
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
            if (!$request->items) {
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
            if ($aggregatedData && isset($aggregatedData['orders'])) {
                foreach ($aggregatedData['orders'] as $order) {
                    $order->update(['production_plan_id' => $plan->id]);
                }
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Tạo kế hoạch sản xuất thành công.',
                'data' => $plan->load('items.item')
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
        $request->validate([
            'status' => 'required|in:PENDING,IN_PROGRESS,COMPLETED,CANCELLED',
        ]);

        $plan = ProductionPlan::findOrFail($id);
        
        // Maybe do some logic when completing production (like reducing inventory for ingredients)
        // For now, we simply update the status
        $plan->update([
            'status' => $request->status,
        ]);

        // If you want to update associated orders' status as well, you can do it here

        return response()->json([
            'success' => true,
            'message' => 'Cập nhật trạng thái thành công.',
            'data' => $plan
        ]);
    }
}
