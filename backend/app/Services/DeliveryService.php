<?php

namespace App\Services;

use App\Models\Delivery;
use App\Models\DeliveryItem;
use App\Models\Order;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class DeliveryService
{
    /**
     * Tạo lịch giao hàng + gán các đơn hàng READY vào lịch đó.
     *
     * @param  array  $data  {
     *   scheduled_date: string (Y-m-d),
     *   scheduled_time: string|null (H:i),
     *   driver_name:    string|null,
     *   driver_phone:   string|null,
     *   vehicle_plate:  string|null,
     *   note:           string|null,
     *   order_ids:      int[]          – danh sách ID đơn hàng (trạng thái READY)
     * }
     * @param  int  $assignedBy  – user ID người tạo lịch
     * @return \App\Models\Delivery
     */
    public function assignDelivery(array $data, int $assignedBy): Delivery
    {
        return DB::transaction(function () use ($data, $assignedBy) {
            // ----- 1. Sinh delivery_code -----
            $today = now()->format('Ymd');
            /** @var \App\Models\Delivery|null $last */
            $last  = Delivery::withTrashed()
                ->where('delivery_code', 'like', "DEL-{$today}-%")
                ->orderByDesc('id')
                ->first();
            $seq  = $last ? ((int) substr((string) $last->delivery_code, -3)) + 1 : 1;
            $code = "DEL-{$today}-" . str_pad($seq, 3, '0', STR_PAD_LEFT);

            // ----- 2. Validate danh sách đơn -----
            $orderIds = $data['order_ids'];
            $orders   = Order::whereIn('id', $orderIds)->get();

            if ($orders->count() !== count($orderIds)) {
                throw ValidationException::withMessages([
                    'order_ids' => 'Một hoặc nhiều đơn hàng không tồn tại.',
                ]);
            }

            $notReady = $orders->where('status', '!=', Order::STATUS_READY);
            if ($notReady->isNotEmpty()) {
                $codes = $notReady->pluck('order_code')->implode(', ');
                throw ValidationException::withMessages([
                    'order_ids' => "Các đơn hàng sau chưa ở trạng thái READY: {$codes}.",
                ]);
            }

            // Kiểm tra đơn đã có trong delivery khác chưa (PENDING / IN_TRANSIT)
            $alreadyAssigned = DeliveryItem::whereIn('order_id', $orderIds)
                ->whereHas('delivery', function ($q) {
                    $q->whereIn('status', [Delivery::STATUS_PENDING, Delivery::STATUS_IN_TRANSIT]);
                })->pluck('order_id')->toArray();

            if (!empty($alreadyAssigned)) {
                $codes = Order::whereIn('id', $alreadyAssigned)->pluck('order_code')->implode(', ');
                throw ValidationException::withMessages([
                    'order_ids' => "Các đơn hàng sau đã được gán vào lịch giao khác đang hoạt động: {$codes}.",
                ]);
            }

            // ----- 3. Tạo Delivery -----
            $delivery = Delivery::create([
                'delivery_code'  => $code,
                'scheduled_date' => $data['scheduled_date'],
                'scheduled_time' => $data['scheduled_time'] ?? null,
                'status'         => Delivery::STATUS_PENDING,
                'driver_name'    => $data['driver_name'] ?? null,
                'driver_phone'   => $data['driver_phone'] ?? null,
                'vehicle_plate'  => $data['vehicle_plate'] ?? null,
                'note'           => $data['note'] ?? null,
                'assigned_by'    => $assignedBy,
            ]);

            // ----- 4. Tạo DeliveryItems -----
            $now = now();
            $items = array_map(fn($oid) => [
                'delivery_id' => $delivery->id,
                'order_id'    => $oid,
                'status'      => 'PENDING',
                'created_at'  => $now,
                'updated_at'  => $now,
            ], $orderIds);

            DeliveryItem::insert($items);

            // ----- 5. Chuyển trạng thái các đơn sang IN_DELIVERY -----
            Order::whereIn('id', $orderIds)->update([
                'status'         => Order::STATUS_IN_DELIVERY,
                'in_delivery_at' => $now,
            ]);

            return $delivery->load(['items.order.store', 'assignedBy']);
        });
    }

    /**
     * Cập nhật trạng thái delivery:
     *   PENDING → IN_TRANSIT  (xe xuất phát)
     *   IN_TRANSIT → DELIVERED (hoàn thành giao)
     *   * → CANCELLED
     */
    public function updateStatus(Delivery $delivery, string $newStatus, ?string $note = null): Delivery
    {
        $allowed = [
            Delivery::STATUS_PENDING    => [Delivery::STATUS_IN_TRANSIT, Delivery::STATUS_CANCELLED],
            Delivery::STATUS_IN_TRANSIT => [Delivery::STATUS_DELIVERED,  Delivery::STATUS_CANCELLED],
            Delivery::STATUS_DELIVERED  => [],
            Delivery::STATUS_CANCELLED  => [],
        ];

        if (!in_array($newStatus, $allowed[$delivery->status] ?? [])) {
            throw ValidationException::withMessages([
                'status' => "Không thể chuyển trạng thái từ '{$delivery->status}' sang '{$newStatus}'.",
            ]);
        }

        return DB::transaction(function () use ($delivery, $newStatus, $note) {
            $now = now();
            $delivery->status = $newStatus;

            if ($newStatus === Delivery::STATUS_IN_TRANSIT) {
                $delivery->dispatched_at = $now;
            }

            if ($newStatus === Delivery::STATUS_DELIVERED) {
                $delivery->completed_at = $now;
                // Đánh dấu tất cả delivery_items DELIVERED
                DeliveryItem::where('delivery_id', $delivery->id)
                    ->where('status', 'PENDING')
                    ->update(['status' => 'DELIVERED', 'delivered_at' => $now]);

                // Chuyển các đơn hàng sang DELIVERED
                $orderIds = DeliveryItem::where('delivery_id', $delivery->id)
                    ->pluck('order_id');
                Order::whereIn('id', $orderIds)->update([
                    'status'       => Order::STATUS_DELIVERED,
                    'delivered_at' => $now,
                ]);
            }

            if ($newStatus === Delivery::STATUS_CANCELLED) {
                // Hoàn nguyên các đơn hàng về READY
                $orderIds = DeliveryItem::where('delivery_id', $delivery->id)
                    ->pluck('order_id');
                Order::whereIn('id', $orderIds)->update([
                    'status'         => Order::STATUS_READY,
                    'in_delivery_at' => null,
                ]);
            }

            if ($note) {
                $delivery->note = $note;
            }

            $delivery->save();

            return $delivery->load(['items.order.store', 'assignedBy']);
        });
    }
}
