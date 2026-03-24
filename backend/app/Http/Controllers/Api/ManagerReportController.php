<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Services\ReportService;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ManagerReportController extends Controller
{
    public function __construct(private readonly ReportService $reportService)
    {
    }

    private function ensureManagerScope(Request $request): void
    {
        $user = $request->user();
        $roleCode = $user?->role?->code;

        if (!in_array($roleCode, ['MANAGER', 'ADMIN'])) {
            abort(response()->json([
                'success' => false,
                'message' => 'Bạn không có quyền truy cập báo cáo quản lý',
            ], 403));
        }
    }

    public function dashboard(Request $request)
    {
        $this->ensureManagerScope($request);

        return response()->json([
            'success' => true,
            'data' => $this->reportService->getManagerDashboard(),
        ]);
    }

    public function inventoryReport(Request $request)
    {
        $this->ensureManagerScope($request);

        return response()->json([
            'success' => true,
            'data' => $this->reportService->getSystemInventoryReport(),
        ]);
    }

    public function productionReport(Request $request)
    {
        $this->ensureManagerScope($request);

        $validated = $request->validate([
            'range' => ['nullable', Rule::in(['weekly', 'monthly'])],
        ]);

        $range = $validated['range'] ?? 'weekly';

        return response()->json([
            'success' => true,
            'data' => [
                'range' => $range,
                'series' => $this->reportService->getProductionReport($range),
            ],
        ]);
    }

    public function ordersSummary(Request $request)
    {
        $this->ensureManagerScope($request);

        $validated = $request->validate([
            'statuses' => ['nullable', 'string'],
            'date_from' => ['nullable', 'date'],
            'date_to' => ['nullable', 'date'],
        ]);

        $statuses = !empty($validated['statuses'])
            ? array_filter(array_map('trim', explode(',', $validated['statuses'])))
            : [Order::STATUS_SUBMITTED, Order::STATUS_CONFIRMED];

        return response()->json([
            'success' => true,
            'data' => $this->reportService->getOrderSummaryForManager(
                $statuses,
                $validated['date_from'] ?? null,
                $validated['date_to'] ?? null
            ),
        ]);
    }
}

