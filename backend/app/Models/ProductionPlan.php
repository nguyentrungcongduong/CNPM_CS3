<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class ProductionPlan extends Model
{
    use HasFactory, SoftDeletes;

    protected $guarded = ['id'];

    public function items()
    {
        return $this->hasMany(ProductionPlanItem::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
    
    public function orders()
    {
        // One production plan could theoretically map to multiple orders, but we can do it softly by date/status
        return $this->hasMany(Order::class);
    }
}
