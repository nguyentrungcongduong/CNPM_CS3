<?php

namespace App\Services;

use App\Models\Order;
use App\Models\User;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Http;

class NotificationService
{
    const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

    // ---------------------------------------------------------------
    // Gửi thông báo khi Store tạo đơn mới (gửi cho Coordinator)
    // ---------------------------------------------------------------
    public function notifyNewOrder(Order $order): void
    {
        $order->load('store');
        $storeName = $order->store?->name ?? 'Cửa hàng';

        // Lấy tất cả Coordinator có push token
        $coordinators = User::whereHas('role', fn($q) => $q->where('code', 'SUPPLY_COORDINATOR'))
            ->whereNotNull('expo_push_token')
            ->get();

        $messages = $coordinators->map(fn($user) => [
            'to'    => $user->expo_push_token,
            'title' => '📦 Đơn hàng mới',
            'body'  => "Đơn {$order->order_code} từ {$storeName} cần xử lý.",
            'data'  => [
                'type'     => 'NEW_ORDER',
                'order_id' => $order->id,
            ],
        ])->values()->toArray();

        $this->sendBatch($messages);
    }

    // ---------------------------------------------------------------
    // Gửi thông báo khi Coordinator xác nhận / từ chối đơn
    // (gửi cho Store Staff tạo đơn)
    // ---------------------------------------------------------------
    public function notifyOrderStatusChanged(Order $order, string $newStatus): void
    {
        $creator = $order->creator ?? User::find($order->created_by);
        if (!$creator || !$creator->expo_push_token) {
            return;
        }

        [$title, $body] = match ($newStatus) {
            Order::STATUS_CONFIRMED => [
                '✅ Đơn được duyệt',
                "Đơn {$order->order_code} đã được xác nhận và đang chờ sản xuất.",
            ],
            Order::STATUS_REJECTED => [
                '❌ Đơn bị từ chối',
                "Đơn {$order->order_code} đã bị từ chối.",
            ],
            Order::STATUS_IN_PRODUCTION => [
                '🍳 Đang sản xuất',
                "Đơn {$order->order_code} đang được sản xuất tại bếp trung tâm.",
            ],
            Order::STATUS_READY => [
                '✅ Sẵn sàng giao',
                "Đơn {$order->order_code} đã hoàn thành sản xuất, sẵn sàng để giao.",
            ],
            Order::STATUS_IN_DELIVERY => [
                '🚚 Đang giao hàng',
                "Đơn {$order->order_code} đang trên đường giao đến cửa hàng bạn.",
            ],
            Order::STATUS_DELIVERED => [
                '🎉 Giao hàng thành công',
                "Đơn {$order->order_code} đã được giao thành công.",
            ],
            Order::STATUS_CANCELLED => [
                '🚫 Đơn đã hủy',
                "Đơn {$order->order_code} đã bị hủy.",
            ],
            default => [
                'Cập nhật đơn hàng',
                "Đơn {$order->order_code} đã chuyển trạng thái: {$newStatus}.",
            ],
        };

        $this->sendBatch([[
            'to'    => $creator->expo_push_token,
            'title' => $title,
            'body'  => $body,
            'data'  => [
                'type'     => 'ORDER_STATUS',
                'order_id' => $order->id,
                'status'   => $newStatus,
            ],
        ]]);
    }

    // ---------------------------------------------------------------
    // Gửi thông báo giao hàng trễ (gọi từ scheduled job)
    // Tìm các delivery IN_TRANSIT quá scheduled_date
    // ---------------------------------------------------------------
    public function notifyLateDeliveries(): void
    {
        $lateDeliveries = \App\Models\Delivery::with(['items.order.creator', 'assignedBy'])
            ->where('status', \App\Models\Delivery::STATUS_IN_TRANSIT)
            ->whereDate('scheduled_date', '<', now()->toDateString())
            ->get();

        foreach ($lateDeliveries as $delivery) {
            // Thông báo coordinator phụ trách
            $coordinator = $delivery->assignedBy;
            if ($coordinator && $coordinator->expo_push_token) {
                $this->sendBatch([[
                    'to'    => $coordinator->expo_push_token,
                    'title' => '⚠️ Giao hàng trễ lịch',
                    'body'  => "Lịch giao {$delivery->delivery_code} đã quá ngày dự kiến ({$delivery->scheduled_date->format('d/m/Y')}).",
                    'data'  => [
                        'type'        => 'LATE_DELIVERY',
                        'delivery_id' => $delivery->id,
                    ],
                ]]);
            }

            // Thông báo store staff chờ hàng
            $storeMessages = [];
            foreach ($delivery->items as $item) {
                $order = $item->order;
                if (!$order) continue;
                $creator = $order->creator ?? User::find($order->created_by);
                if ($creator && $creator->expo_push_token) {
                    $storeMessages[] = [
                        'to'    => $creator->expo_push_token,
                        'title' => '⚠️ Hàng giao trễ',
                        'body'  => "Đơn {$order->order_code} bị giao trễ. Xin lỗi vì sự bất tiện này.",
                        'data'  => [
                            'type'     => 'LATE_DELIVERY',
                            'order_id' => $order->id,
                        ],
                    ];
                }
            }

            if (!empty($storeMessages)) {
                $this->sendBatch($storeMessages);
            }
        }
    }

    // ---------------------------------------------------------------
    // Gửi batch messages lên Expo Push API
    // Expo cho phép gửi tối đa 100 messages / request
    // ---------------------------------------------------------------
    public function sendBatch(array $messages): void
    {
        if (empty($messages)) return;

        // Lọc bỏ token không hợp lệ
        $messages = array_filter($messages, fn($m) => str_starts_with($m['to'] ?? '', 'ExponentPushToken['));

        if (empty($messages)) return;

        // Chia thành chunks 100
        foreach (array_chunk(array_values($messages), 100) as $chunk) {
            try {
                $response = Http::withHeaders([
                    'Accept'       => 'application/json',
                    'Content-Type' => 'application/json',
                ])->post(self::EXPO_PUSH_URL, $chunk);

                if (!$response->successful()) {
                    Log::warning('Expo Push: HTTP error', [
                        'status' => $response->status(),
                        'body'   => $response->body(),
                    ]);
                }

                // Log các ticket lỗi từng message
                $tickets = $response->json('data') ?? [];
                foreach ($tickets as $i => $ticket) {
                    if (($ticket['status'] ?? '') === 'error') {
                        Log::warning('Expo Push ticket error', [
                            'message' => $chunk[$i] ?? null,
                            'ticket'  => $ticket,
                        ]);
                    }
                }
            } catch (\Throwable $e) {
                Log::error('Expo Push: Exception', ['error' => $e->getMessage()]);
            }
        }
    }
}
