<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Order extends Model
{
    use HasFactory;
    use SoftDeletes;

    // ---------------------------------------------------------------
    // Full Status Flow:
    // DRAFT → SUBMITTED → CONFIRMED → IN_PRODUCTION → READY
    //       → IN_DELIVERY → DELIVERED → COMPLETED
    // Side-exits: REJECTED / CANCELLED (from certain states)
    // ---------------------------------------------------------------

    const STATUS_DRAFT        = 'DRAFT';
    const STATUS_SUBMITTED    = 'SUBMITTED';
    const STATUS_CONFIRMED    = 'CONFIRMED';
    const STATUS_IN_PRODUCTION = 'IN_PRODUCTION';
    const STATUS_READY        = 'READY';
    const STATUS_IN_DELIVERY  = 'IN_DELIVERY';
    const STATUS_DELIVERED    = 'DELIVERED';
    const STATUS_COMPLETED    = 'COMPLETED';
    const STATUS_REJECTED     = 'REJECTED';
    const STATUS_CANCELLED    = 'CANCELLED';

    /**
     * Allowed next-statuses per current status.
     * Used to validate transitions on the backend.
     */
    const ALLOWED_TRANSITIONS = [
        self::STATUS_DRAFT        => [self::STATUS_SUBMITTED, self::STATUS_CANCELLED],
        self::STATUS_SUBMITTED    => [self::STATUS_CONFIRMED, self::STATUS_REJECTED],
        self::STATUS_CONFIRMED    => [self::STATUS_IN_PRODUCTION, self::STATUS_CANCELLED],
        self::STATUS_IN_PRODUCTION => [self::STATUS_READY],
        self::STATUS_READY        => [self::STATUS_IN_DELIVERY],
        self::STATUS_IN_DELIVERY  => [self::STATUS_DELIVERED],
        self::STATUS_DELIVERED    => [self::STATUS_COMPLETED],
        self::STATUS_COMPLETED    => [],
        self::STATUS_REJECTED     => [],
        self::STATUS_CANCELLED    => [],
    ];

    protected $fillable = [
        'order_code',
        'store_id',
        'warehouse_id',
        'created_by',
        'approved_by',
        'confirmed_by',
        'status',
        'order_date',
        'required_date',
        'note',
        'cancel_reason',
        'confirmed_at',
        'production_started_at',
        'ready_at',
        'in_delivery_at',
        'delivered_at',
        'completed_at',
        'kitchen_processed_at',
    ];

    protected $casts = [
        'order_date'           => 'datetime',
        'required_date'        => 'date',
        'confirmed_at'         => 'datetime',
        'production_started_at' => 'datetime',
        'ready_at'             => 'datetime',
        'in_delivery_at'       => 'datetime',
        'delivered_at'         => 'datetime',
        'completed_at'         => 'datetime',
        'kitchen_processed_at' => 'datetime',
    ];

    // ---------------------------------------------------------------
    // Helper: check if a transition is valid
    // ---------------------------------------------------------------
    public function canTransitionTo(string $newStatus): bool
    {
        $allowed = self::ALLOWED_TRANSITIONS[$this->status] ?? [];
        return in_array($newStatus, $allowed);
    }

    // ---------------------------------------------------------------
    // Relationships
    // ---------------------------------------------------------------
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

    public function confirmedBy()
    {
        return $this->belongsTo(User::class, 'confirmed_by');
    }

    public function items()
    {
        return $this->hasMany(OrderItem::class);
    }
}
