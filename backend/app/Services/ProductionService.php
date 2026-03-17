<?php

namespace App\Services;

use App\Models\Order;
use App\Models\Item;
use App\Models\Recipe;

class ProductionService
{
    /**
     * Group items from pending/confirmed orders for a specific date
     */
    public function aggregateOrders($date)
    {
        $orders = Order::with('items.item')
            ->where(function ($q) use ($date) {
                // Preferred: required_date (requested delivery/need-by date)
                // Fallback: order_date (creation timestamp) when required_date is not set
                $q->whereDate('required_date', $date)
                  ->orWhereDate('order_date', $date);
            })
            // Accept orders that are ready/authorized for production planning
            ->whereIn('status', ['CONFIRMED', 'APPROVED'])
            ->whereNull('production_plan_id')
            ->get();
            
        $aggregated = [];
        
        foreach ($orders as $order) {
            foreach ($order->items as $orderItem) {
                $itemId = $orderItem->item_id;
                
                if (!isset($aggregated[$itemId])) {
                    $aggregated[$itemId] = [
                        'item' => $orderItem->item,
                        'total_quantity' => 0,
                    ];
                }
                
                $qty = $orderItem->approved_quantity ?? $orderItem->ordered_quantity;
                $aggregated[$itemId]['total_quantity'] += (float) $qty;
            }
        }
        
        return [
            'orders' => $orders,
            'aggregated_items' => array_values($aggregated)
        ];
    }

    /**
     * Calculate required ingredients for the given items and quantities
     * $itemsToProduce expected format: [ ['item_id' => X, 'quantity' => Y], ... ]
     */
    public function calculateIngredients($itemsToProduce)
    {
        $ingredients = [];
        
        foreach ($itemsToProduce as $prodItem) {
            $itemId = $prodItem['item_id'];
            $produceQty = $prodItem['quantity'];
            
            $item = Item::find($itemId);
            if (!$item) continue;
            
            // Assume recipe code corresponds to item code
            $recipe = Recipe::with('recipeItems.item')->where('code', $item->code)->first();
            
            if ($recipe) {
                foreach ($recipe->recipeItems as $recipeItem) {
                    /** @var \App\Models\RecipeItem $recipeItem */
                    $ingId = $recipeItem->item_id;
                    $qtyNeeded = $recipeItem->quantity * $produceQty;
                    
                    if (!isset($ingredients[$ingId])) {
                        $ingredients[$ingId] = [
                            'item' => $recipeItem->item,
                            'total_quantity' => 0
                        ];
                    }
                    $ingredients[$ingId]['total_quantity'] += $qtyNeeded;
                }
            }
        }
        
        return array_values($ingredients);
    }
}
