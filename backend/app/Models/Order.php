<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Order extends Model
{
    use HasFactory;
    use SoftDeletes;

    protected $fillable = [
        'order_code',
        'store_id',
        'warehouse_id',
        'created_by',
        'approved_by',
        'status',
        'order_date',
        'required_date',
        'note',
        'cancel_reason',
    ];

    protected $casts = [
        'order_date' => 'datetime',
        'required_date' => 'date',
    ];

    public function store()
    {
        return $this->belongsTo(Store::class);
    }

    public function warehouse()
    {
        return $this->belongsTo(Warehouse::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function approver()
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function items()
    {
        return $this->hasMany(OrderItem::class);
    }
}
