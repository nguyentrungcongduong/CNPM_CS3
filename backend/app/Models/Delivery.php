<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Delivery extends Model
{
    use HasFactory, SoftDeletes;

    const STATUS_PENDING   = 'PENDING';
    const STATUS_IN_TRANSIT = 'IN_TRANSIT';
    const STATUS_DELIVERED = 'DELIVERED';
    const STATUS_CANCELLED = 'CANCELLED';

    protected $fillable = [
        'delivery_code',
        'scheduled_date',
        'scheduled_time',
        'status',
        'driver_name',
        'driver_phone',
        'vehicle_plate',
        'note',
        'assigned_by',
        'dispatched_at',
        'completed_at',
    ];

    protected $casts = [
        'scheduled_date' => 'date',
        'dispatched_at'  => 'datetime',
        'completed_at'   => 'datetime',
    ];

    // ---------------------------------------------------------------
    // Relationships
    // ---------------------------------------------------------------
    public function assignedBy()
    {
        return $this->belongsTo(User::class, 'assigned_by');
    }

    public function items()
    {
        return $this->hasMany(DeliveryItem::class);
    }

    public function orders()
    {
        return $this->belongsToMany(Order::class, 'delivery_items')
                    ->withPivot(['status', 'note', 'delivered_at'])
                    ->withTimestamps();
    }
}
