<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class OrderItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'order_id',
        'item_id',
        'ordered_quantity',
        'approved_quantity',
        'delivered_quantity',
        'unit',
        'note',
    ];

    protected $casts = [
        'ordered_quantity' => 'decimal:3',
        'approved_quantity' => 'decimal:3',
        'delivered_quantity' => 'decimal:3',
    ];

    public function order()
    {
        return $this->belongsTo(Order::class);
    }

    public function item()
    {
        return $this->belongsTo(Item::class);
    }
}
