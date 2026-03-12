<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Batch extends Model
{
    protected $fillable = [
        'batch_code',
        'item_id',
        'warehouse_id',
        'quantity',
        'initial_quantity',
        'mfg_date',
        'expiry_date',
        'status',
    ];

    protected $casts = [
        'quantity' => 'decimal:3',
        'initial_quantity' => 'decimal:3',
        'mfg_date' => 'date',
        'expiry_date' => 'date',
    ];

    public function item()
    {
        return $this->belongsTo(Item::class);
    }

    public function warehouse()
    {
        return $this->belongsTo(Warehouse::class);
    }

    public function transactions()
    {
        return $this->hasMany(InventoryTransaction::class, 'reference_id')
            ->where('reference_type', 'batch');
    }

    /**
     * Scope for near expiry batches
     */
    public function scopeNearExpiry($query, $days = 7)
    {
        return $query->where('status', 'ACTIVE')
            ->where('quantity', '>', 0)
            ->where('expiry_date', '<=', now()->addDays($days));
    }
}
