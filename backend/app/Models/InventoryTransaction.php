<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class InventoryTransaction extends Model
{
    protected $fillable = [
        'inventory_id',
        'warehouse_id',
        'item_id',
        'user_id',
        'reference_type',
        'reference_id',
        'type',
        'quantity',
        'quantity_before',
        'quantity_after',
        'note',
    ];

    protected $casts = [
        'quantity'        => 'decimal:3',
        'quantity_before' => 'decimal:3',
        'quantity_after'  => 'decimal:3',
    ];

    public function inventory()
    {
        return $this->belongsTo(Inventory::class);
    }

    public function warehouse()
    {
        return $this->belongsTo(Warehouse::class);
    }

    public function item()
    {
        return $this->belongsTo(Item::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
