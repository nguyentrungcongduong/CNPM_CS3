<?php

namespace App\Jobs;

use App\Models\Order;
use App\Services\NotificationService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class SendOrderNotification implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * Số lần retry nếu job fail
     */
    public int $tries = 3;

    /**
     * Timeout mỗi lần chạy (giây)
     */
    public int $timeout = 30;

    public function __construct(
        public readonly Order  $order,
        public readonly string $event,   // 'new_order' | 'status_changed'
        public readonly string $newStatus = '',
    ) {}

    public function handle(NotificationService $notificationService): void
    {
        match ($this->event) {
            'new_order'      => $notificationService->notifyNewOrder($this->order),
            'status_changed' => $notificationService->notifyOrderStatusChanged($this->order, $this->newStatus),
            default          => null,
        };
    }
}
