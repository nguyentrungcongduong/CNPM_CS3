<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ProductionPlanItem extends Model
{
    use HasFactory;

    protected $guarded = ['id'];

    public function plan()
    {
        return $this->belongsTo(ProductionPlan::class, 'production_plan_id');
    }

    public function item()
    {
        return $this->belongsTo(Item::class, 'item_id');
    }
}
