<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DeliveryItem extends Model
{
    protected $fillable = [
        'delivery_id',
        'order_id',
        'status',
        'note',
        'delivered_at',
    ];

    protected $casts = [
        'delivered_at' => 'datetime',
    ];

    // ---------------------------------------------------------------
    // Relationships
    // ---------------------------------------------------------------
    public function delivery()
    {
        return $this->belongsTo(Delivery::class);
    }

    public function order()
    {
        return $this->belongsTo(Order::class);
    }
}
