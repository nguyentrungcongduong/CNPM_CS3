<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Delivery;
use App\Models\Order;
use App\Models\Store;
use App\Models\User;
use App\Models\Warehouse;
use Carbon\Carbon;

class AdminReportController extends Controller
{
    /**
     * GET /api/admin/overview
     *
     * Tổng quan hệ thống cho Admin: users / stores / kitchens / orders / deliveries.
     */
    public function overview()
    {
        $today = Carbon::today();

        return response()->json([
            'users' => [
                'total'  => User::count(),
                'active' => User::where('status', 'ACTIVE')->count(),
            ],
            'stores' => [
                'total'  => Store::count(),
                'active' => Store::where('status', 'ACTIVE')->count(),
            ],
            'kitchens' => [
                'total' => Warehouse::where('type', 'KITCHEN')->count(),
                'active' => Warehouse::where('type', 'KITCHEN')->where('status', 'ACTIVE')->count(),
            ],
            'orders' => [
                'today'     => Order::whereDate('created_at', $today)->count(),
                'total'     => Order::count(),
                'completed' => Order::where('status', Order::STATUS_COMPLETED)->count(),
            ],
            'deliveries' => [
                'in_transit' => Delivery::where('status', Delivery::STATUS_IN_TRANSIT)->count(),
                'completed'  => Delivery::where('status', Delivery::STATUS_DELIVERED)->count(),
            ],
        ]);
    }
}
