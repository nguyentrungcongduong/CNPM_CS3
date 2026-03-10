<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
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

    public function recipes(): HasMany
    {
        return $this->hasMany(Recipe::class);
    }

    public function ingredientInRecipeItems(): HasMany
    {
        return $this->hasMany(RecipeItem::class, 'ingredient_item_id');
    }
}