<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Recipe extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'code',
        'name',
        'description',
        'status',
    ];

    public function recipeItems()
    {
        return $this->hasMany(RecipeItem::class);
    }

    public function items()
    {
        return $this->belongsToMany(Item::class, 'recipe_items')->withPivot('quantity')->withTimestamps();
    }
}
