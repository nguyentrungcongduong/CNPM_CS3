<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\App;
use Illuminate\Support\Facades\DB;

class DevController extends Controller
{
    private function ensureAdmin(Request $request): void
    {
        $user = $request->user();
        $roleCode = $user?->role?->code;

        if ($roleCode !== 'ADMIN') {
            abort(response()->json([
                'success' => false,
                'message' => 'Bạn không có quyền thực hiện hành động này (cần vai trò ADMIN)',
            ], 403));
        }
    }

    private function ensureNonProduction(): void
    {
        if (!App::environment(['local', 'development', 'testing'])) {
            abort(response()->json([
                'success' => false,
                'message' => 'Chỉ cho phép reset dữ liệu ở môi trường development/testing.',
            ], 403));
        }
    }

    /**
     * POST /api/dev/reset-data
     *
     * Development-only endpoint to reset test data.
     */
    public function resetData(Request $request)
    {
        $this->ensureAdmin($request);
        $this->ensureNonProduction();

        $driver = DB::getDriverName();

        return DB::transaction(function () use ($driver) {
            // Avoid FK issues when truncating
            if ($driver === 'mysql') {
                DB::statement('SET FOREIGN_KEY_CHECKS=0');
            } elseif ($driver === 'sqlite') {
                DB::statement('PRAGMA foreign_keys = OFF');
            }

            // Inventory transactions can reference batches via FK (batch_id).
            // We keep transactions but remove FK references so truncating batches is safe.
            if (DB::getSchemaBuilder()->hasTable('inventory_transactions')) {
                DB::table('inventory_transactions')->update(['batch_id' => null]);
            }

            // Truncate in child → parent order
            if (DB::getSchemaBuilder()->hasTable('order_items')) DB::table('order_items')->truncate();
            if (DB::getSchemaBuilder()->hasTable('orders')) DB::table('orders')->truncate();

            if (DB::getSchemaBuilder()->hasTable('production_plan_items')) DB::table('production_plan_items')->truncate();
            if (DB::getSchemaBuilder()->hasTable('production_plans')) DB::table('production_plans')->truncate();

            if (DB::getSchemaBuilder()->hasTable('batches')) DB::table('batches')->truncate();

            if ($driver === 'mysql') {
                DB::statement('SET FOREIGN_KEY_CHECKS=1');
            } elseif ($driver === 'sqlite') {
                DB::statement('PRAGMA foreign_keys = ON');
            }

            return response()->json([
                'success' => true,
                'message' => 'Đã reset dữ liệu test thành công.',
                'data' => [
                    'tables' => ['orders', 'order_items', 'production_plans', 'production_plan_items', 'batches'],
                ],
            ]);
        });
    }
}

