<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Item extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'code',
        'name',
        'type',
        'unit',
        'default_price',
        'shelf_life_days',
        'min_stock',
        'description',
        'status',
    ];

    public function inventories()
    {
        return $this->hasMany(Inventory::class);
    }

    public function recipeItems()
    {
        return $this->hasMany(RecipeItem::class);
    }
}
