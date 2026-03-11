<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Inventory extends Model
{
    protected $table = 'inventory';

    protected $fillable = [
        'warehouse_id',
        'item_id',
        'quantity_on_hand',
        'quantity_reserved',
        'quantity_available',
        'last_updated_at',
    ];

    protected $casts = [
        'quantity_on_hand'   => 'decimal:3',
        'quantity_reserved'  => 'decimal:3',
        'quantity_available' => 'decimal:3',
        'last_updated_at'    => 'datetime',
    ];

    public function warehouse()
    {
        return $this->belongsTo(Warehouse::class);
    }

    public function item()
    {
        return $this->belongsTo(Item::class);
    }

    public function transactions()
    {
        return $this->hasMany(InventoryTransaction::class);
    }
}
