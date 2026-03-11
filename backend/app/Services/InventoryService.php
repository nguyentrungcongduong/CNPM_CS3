<?php

namespace App\Services;

use App\Models\Inventory;
use App\Models\InventoryTransaction;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;

class InventoryService
{
    public function getOrCreate(int $warehouseId, int $itemId): Inventory
    {
        return Inventory::firstOrCreate(
            ['warehouse_id' => $warehouseId, 'item_id' => $itemId],
            [
                'quantity_on_hand'   => 0,
                'quantity_reserved'  => 0,
                'quantity_available' => 0,
                'last_updated_at'    => now(),
            ]
        );
    }

    public function increaseStock(
        int $warehouseId,
        int $itemId,
        float $qty,
        string $note = '',
        ?string $refType = null,
        ?int $refId = null
    ): Inventory {
        return DB::transaction(function () use ($warehouseId, $itemId, $qty, $note, $refType, $refId) {
            $inv = $this->getOrCreate($warehouseId, $itemId);
            $before = (float) $inv->quantity_on_hand;

            $inv->quantity_on_hand   = $before + $qty;
            $inv->quantity_available = (float) $inv->quantity_on_hand - (float) $inv->quantity_reserved;
            $inv->last_updated_at    = now();
            $inv->save();

            $this->log($inv, 'IN', $qty, $before, $inv->quantity_on_hand, $note, $refType, $refId);

            return $inv;
        });
    }

    public function decreaseStock(
        int $warehouseId,
        int $itemId,
        float $qty,
        string $note = '',
        ?string $refType = null,
        ?int $refId = null
    ): Inventory {
        return DB::transaction(function () use ($warehouseId, $itemId, $qty, $note, $refType, $refId) {
            $inv = $this->getOrCreate($warehouseId, $itemId);
            $before = (float) $inv->quantity_on_hand;

            if ($inv->quantity_available < $qty) {
                throw new \Exception("Không đủ tồn kho. Có sẵn: {$inv->quantity_available}");
            }

            $inv->quantity_on_hand   = $before - $qty;
            $inv->quantity_available = (float) $inv->quantity_on_hand - (float) $inv->quantity_reserved;
            $inv->last_updated_at    = now();
            $inv->save();

            $this->log($inv, 'OUT', $qty, $before, $inv->quantity_on_hand, $note, $refType, $refId);

            return $inv;
        });
    }

    public function reserveStock(
        int $warehouseId,
        int $itemId,
        float $qty,
        string $note = '',
        ?string $refType = null,
        ?int $refId = null
    ): Inventory {
        return DB::transaction(function () use ($warehouseId, $itemId, $qty, $note, $refType, $refId) {
            $inv = $this->getOrCreate($warehouseId, $itemId);
            $before = (float) $inv->quantity_reserved;

            if ($inv->quantity_available < $qty) {
                throw new \Exception("Không đủ hàng để giữ. Có sẵn: {$inv->quantity_available}");
            }

            $inv->quantity_reserved  = $before + $qty;
            $inv->quantity_available = (float) $inv->quantity_on_hand - (float) $inv->quantity_reserved;
            $inv->last_updated_at    = now();
            $inv->save();

            $this->log($inv, 'RESERVE', $qty, $before, $inv->quantity_reserved, $note, $refType, $refId);

            return $inv;
        });
    }

    public function unreserveStock(
        int $warehouseId,
        int $itemId,
        float $qty,
        string $note = '',
        ?string $refType = null,
        ?int $refId = null
    ): Inventory {
        return DB::transaction(function () use ($warehouseId, $itemId, $qty, $note, $refType, $refId) {
            $inv = $this->getOrCreate($warehouseId, $itemId);
            $before = (float) $inv->quantity_reserved;

            $inv->quantity_reserved  = max(0, $before - $qty);
            $inv->quantity_available = (float) $inv->quantity_on_hand - (float) $inv->quantity_reserved;
            $inv->last_updated_at    = now();
            $inv->save();

            $this->log($inv, 'UNRESERVE', $qty, $before, $inv->quantity_reserved, $note, $refType, $refId);

            return $inv;
        });
    }

    public function adjustStock(
        int $warehouseId,
        int $itemId,
        float $newQty,
        string $note = ''
    ): Inventory {
        return DB::transaction(function () use ($warehouseId, $itemId, $newQty, $note) {
            $inv = $this->getOrCreate($warehouseId, $itemId);
            $before = (float) $inv->quantity_on_hand;
            $diff   = $newQty - $before;

            $inv->quantity_on_hand   = $newQty;
            $inv->quantity_available = (float) $inv->quantity_on_hand - (float) $inv->quantity_reserved;
            $inv->last_updated_at    = now();
            $inv->save();

            $this->log($inv, 'ADJUST', abs($diff), $before, $newQty, $note);

            return $inv;
        });
    }

    private function log(
        Inventory $inv,
        string $type,
        float $qty,
        float $before,
        float $after,
        string $note = '',
        ?string $refType = null,
        ?int $refId = null
    ): void {
        InventoryTransaction::create([
            'inventory_id'   => $inv->id,
            'warehouse_id'   => $inv->warehouse_id,
            'item_id'        => $inv->item_id,
            'user_id'        => Auth::id(),
            'reference_type' => $refType,
            'reference_id'   => $refId,
            'type'           => $type,
            'quantity'       => $qty,
            'quantity_before'=> $before,
            'quantity_after' => $after,
            'note'           => $note,
        ]);
    }
}
