<?php

namespace App\Observers;

use App\Models\Order;
use App\Models\OrderStatusHistory;
use Illuminate\Support\Facades\Auth;

class OrderObserver
{
    /**
     * Handle the Order "created" event.
     * Log initial status creation.
     */
    public function created(Order $order): void
    {
        OrderStatusHistory::create([
            'order_id' => $order->id,
            'from_status' => null,
            'to_status' => $order->status,
            'changed_by' => Auth::id(),
            'note' => 'Đơn hàng được tạo',
        ]);
    }

    /**
     * Handle the Order "updated" event.
     * Log status changes.
     */
    public function updated(Order $order): void
    {
        if ($order->isDirty('status')) {
            $fromStatus = $order->getOriginal('status');
            $toStatus = $order->status;
            
            OrderStatusHistory::create([
                'order_id' => $order->id,
                'from_status' => $fromStatus,
                'to_status' => $toStatus,
                'changed_by' => Auth::id(),
                'note' => $this->getStatusChangeNote($fromStatus, $toStatus),
            ]);
        }
    }

    /**
     * Get human-readable note for status change.
     */
    private function getStatusChangeNote(?string $from, string $to): string
    {
        $statusLabels = [
            'DRAFT' => 'Bản nháp',
            'SUBMITTED' => 'Đã gửi',
            'CONFIRMED' => 'Đã xác nhận',
            'IN_PRODUCTION' => 'Đang sản xuất',
            'READY' => 'Sẵn sàng giao',
            'IN_DELIVERY' => 'Đang giao',
            'DELIVERED' => 'Đã giao',
            'COMPLETED' => 'Hoàn thành',
            'CANCELLED' => 'Đã hủy',
            'REJECTED' => 'Đã từ chối',
        ];

        $fromLabel = $from ? ($statusLabels[$from] ?? $from) : 'Khởi tạo';
        $toLabel = $statusLabels[$to] ?? $to;

        return "Chuyển từ \"{$fromLabel}\" sang \"{$toLabel}\"";
    }
}
