<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Store;
use App\Models\User;
use App\Models\Item;
use App\Models\Warehouse;
use Illuminate\Support\Str;

class OrderSeeder extends Seeder
{
    public function run(): void
    {
        $stores = Store::whereIn('code', ['STORE-A', 'STORE-B', 'STORE-C'])->get();
        $storeA = $stores->where('code', 'STORE-A')->first();
        $storeB = $stores->where('code', 'STORE-B')->first();
        $storeC = $stores->where('code', 'STORE-C')->first();
        
        $kitchen = Warehouse::where('type', 'KITCHEN')->first();
        $coordinator = User::where('username', 'coordinator1')->first();
        
        // Lấy các items có tên thực tế
        $thitBoMy = Item::where('code', 'ING-CHK-BREAST')->first(); // Thịt gà
        $suaTuoi = Item::where('code', 'ING-MILK-FRESH')->first(); // Sữa tươi
        $trungGa = Item::where('code', 'ING-EGG-CHICKEN')->first(); // Trứng gà
        $boLat = Item::where('code', 'ING-BUTTER-UNSALTED')->first(); // Bơ lạt
        $botMi = Item::where('code', 'ING-FLOUR-WHEAT')->first(); // Bột mì
        
        // Order 1: DRAFT (Store A)
        $this->createOrder([
            'store' => $storeA,
            'kitchen' => $kitchen,
            'created_by' => $coordinator,
            'status' => Order::STATUS_DRAFT,
            'order_date' => now()->subDays(2),
            'required_date' => now()->addDays(3),
            'items' => [
                ['item' => $thitBoMy, 'qty' => 10, 'unit' => 'kg'],
                ['item' => $suaTuoi, 'qty' => 5, 'unit' => 'pack'],
            ],
        ]);

        // Order 2: SUBMITTED (Store B)
        $this->createOrder([
            'store' => $storeB,
            'kitchen' => $kitchen,
            'created_by' => $coordinator,
            'status' => Order::STATUS_SUBMITTED,
            'order_date' => now()->subDays(1),
            'required_date' => now()->addDays(2),
            'items' => [
                ['item' => $trungGa, 'qty' => 50, 'unit' => 'piece'],
                ['item' => $botMi, 'qty' => 20, 'unit' => 'kg'],
            ],
        ]);

        // Order 3: CONFIRMED (Store C)
        $order3 = $this->createOrder([
            'store' => $storeC,
            'kitchen' => $kitchen,
            'created_by' => $coordinator,
            'status' => Order::STATUS_CONFIRMED,
            'order_date' => now()->subDays(3),
            'required_date' => now()->addDays(1),
            'items' => [
                ['item' => $thitBoMy, 'qty' => 15, 'unit' => 'kg'],
                ['item' => $boLat, 'qty' => 10, 'unit' => 'pack'],
                ['item' => $suaTuoi, 'qty' => 8, 'unit' => 'pack'],
            ],
        ]);
        $order3->confirmed_by = $coordinator->id;
        $order3->confirmed_at = now()->subDays(2);
        $order3->save();

        // Order 4: IN_PRODUCTION (Store A)
        $order4 = $this->createOrder([
            'store' => $storeA,
            'kitchen' => $kitchen,
            'created_by' => $coordinator,
            'status' => Order::STATUS_IN_PRODUCTION,
            'order_date' => now()->subDays(4),
            'required_date' => now(),
            'items' => [
                ['item' => $trungGa, 'qty' => 100, 'unit' => 'piece'],
                ['item' => $botMi, 'qty' => 30, 'unit' => 'kg'],
                ['item' => $boLat, 'qty' => 5, 'unit' => 'pack'],
            ],
        ]);
        $order4->confirmed_by = $coordinator->id;
        $order4->confirmed_at = now()->subDays(3);
        $order4->production_started_at = now()->subDays(2);
        $order4->save();

        // Order 5: READY (Store B)
        $order5 = $this->createOrder([
            'store' => $storeB,
            'kitchen' => $kitchen,
            'created_by' => $coordinator,
            'status' => Order::STATUS_READY,
            'order_date' => now()->subDays(5),
            'required_date' => now()->subDays(1),
            'items' => [
                ['item' => $thitBoMy, 'qty' => 20, 'unit' => 'kg'],
                ['item' => $suaTuoi, 'qty' => 10, 'unit' => 'pack'],
            ],
        ]);
        $order5->confirmed_by = $coordinator->id;
        $order5->confirmed_at = now()->subDays(4);
        $order5->production_started_at = now()->subDays(3);
        $order5->ready_at = now()->subDays(1);
        $order5->save();

        // Order 6: IN_DELIVERY (Store C)
        $order6 = $this->createOrder([
            'store' => $storeC,
            'kitchen' => $kitchen,
            'created_by' => $coordinator,
            'status' => Order::STATUS_IN_DELIVERY,
            'order_date' => now()->subDays(6),
            'required_date' => now()->subDays(2),
            'items' => [
                ['item' => $botMi, 'qty' => 25, 'unit' => 'kg'],
                ['item' => $trungGa, 'qty' => 60, 'unit' => 'piece'],
                ['item' => $boLat, 'qty' => 8, 'unit' => 'pack'],
            ],
        ]);
        $order6->confirmed_by = $coordinator->id;
        $order6->confirmed_at = now()->subDays(5);
        $order6->production_started_at = now()->subDays(4);
        $order6->ready_at = now()->subDays(3);
        $order6->in_delivery_at = now()->subDays(1);
        $order6->save();

        // Order 7: DELIVERED (Store A) - Đang chờ Store nhận hàng
        $order7 = $this->createOrder([
            'store' => $storeA,
            'kitchen' => $kitchen,
            'created_by' => $coordinator,
            'status' => Order::STATUS_DELIVERED,
            'order_date' => now()->subDays(7),
            'required_date' => now()->subDays(3),
            'items' => [
                ['item' => $thitBoMy, 'qty' => 12, 'unit' => 'kg'],
                ['item' => $suaTuoi, 'qty' => 6, 'unit' => 'pack'],
                ['item' => $trungGa, 'qty' => 40, 'unit' => 'piece'],
            ],
        ]);
        $order7->confirmed_by = $coordinator->id;
        $order7->confirmed_at = now()->subDays(6);
        $order7->production_started_at = now()->subDays(5);
        $order7->ready_at = now()->subDays(4);
        $order7->in_delivery_at = now()->subDays(3);
        $order7->delivered_at = now()->subDays(1);
        $order7->save();

        // Order 8: COMPLETED (Store B)
        $order8 = $this->createOrder([
            'store' => $storeB,
            'kitchen' => $kitchen,
            'created_by' => $coordinator,
            'status' => Order::STATUS_COMPLETED,
            'order_date' => now()->subDays(10),
            'required_date' => now()->subDays(6),
            'items' => [
                ['item' => $botMi, 'qty' => 15, 'unit' => 'kg'],
                ['item' => $boLat, 'qty' => 3, 'unit' => 'pack'],
            ],
        ]);
        $order8->confirmed_by = $coordinator->id;
        $order8->confirmed_at = now()->subDays(9);
        $order8->production_started_at = now()->subDays(8);
        $order8->ready_at = now()->subDays(7);
        $order8->in_delivery_at = now()->subDays(6);
        $order8->delivered_at = now()->subDays(5);
        $order8->completed_at = now()->subDays(4);
        $order8->save();

        // Order 9: CANCELLED (Store C)
        $order9 = $this->createOrder([
            'store' => $storeC,
            'kitchen' => $kitchen,
            'created_by' => $coordinator,
            'status' => Order::STATUS_CANCELLED,
            'order_date' => now()->subDays(8),
            'required_date' => now()->subDays(4),
            'note' => 'Khách hàng hủy đơn',
            'items' => [
                ['item' => $thitBoMy, 'qty' => 8, 'unit' => 'kg'],
            ],
        ]);
        $order9->cancel_reason = 'Khách đổi ý, không cần gấp';
        $order9->save();
    }

    private function createOrder(array $data): Order
    {
        $orderCode = 'ORD-' . strtoupper(Str::random(6)) . '-' . now()->format('ymdHis');
        
        $order = Order::create([
            'order_code' => $orderCode,
            'store_id' => $data['store']->id,
            'warehouse_id' => $data['kitchen']?->id,
            'created_by' => $data['created_by']->id,
            'status' => $data['status'],
            'order_date' => $data['order_date'],
            'required_date' => $data['required_date'],
            'note' => $data['note'] ?? null,
        ]);

        foreach ($data['items'] as $itemData) {
            OrderItem::create([
                'order_id' => $order->id,
                'item_id' => $itemData['item']->id,
                'ordered_quantity' => $itemData['qty'],
                'approved_quantity' => in_array($data['status'], ['CONFIRMED', 'IN_PRODUCTION', 'READY', 'IN_DELIVERY', 'DELIVERED', 'COMPLETED']) ? $itemData['qty'] : null,
                'delivered_quantity' => in_array($data['status'], ['DELIVERED', 'COMPLETED']) ? $itemData['qty'] : null,
                'unit' => $itemData['unit'],
            ]);
        }

        return $order;
    }
}
