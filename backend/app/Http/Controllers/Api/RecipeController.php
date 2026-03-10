<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Recipe;
use App\Models\RecipeItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class RecipeController extends Controller
{
    public function index()
    {
        $recipes = Recipe::with(['item', 'recipeItems.ingredient'])->latest()->paginate(10);

        return response()->json([
            'success' => true,
            'data' => $recipes,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'item_id' => ['required', 'exists:items,id'],
            'version' => ['nullable', 'integer'],
            'yield_quantity' => ['required', 'numeric'],
            'note' => ['nullable', 'string'],
            'is_active' => ['nullable', 'boolean'],
            'recipe_items' => ['required', 'array', 'min:1'],
            'recipe_items.*.ingredient_item_id' => ['required', 'exists:items,id'],
            'recipe_items.*.quantity' => ['required', 'numeric'],
            'recipe_items.*.unit' => ['required', 'string'],
            'recipe_items.*.waste_rate' => ['nullable', 'numeric'],
        ]);

        DB::beginTransaction();

        try {
            $recipe = Recipe::create([
                'item_id' => $validated['item_id'],
                'version' => $validated['version'] ?? 1,
                'yield_quantity' => $validated['yield_quantity'],
                'note' => $validated['note'] ?? null,
                'is_active' => $validated['is_active'] ?? true,
            ]);

            foreach ($validated['recipe_items'] as $recipeItem) {
                RecipeItem::create([
                    'recipe_id' => $recipe->id,
                    'ingredient_item_id' => $recipeItem['ingredient_item_id'],
                    'quantity' => $recipeItem['quantity'],
                    'unit' => $recipeItem['unit'],
                    'waste_rate' => $recipeItem['waste_rate'] ?? null,
                ]);
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Tạo recipe thành công',
                'data' => $recipe->load(['item', 'recipeItems.ingredient']),
            ], 201);
        } catch (\Throwable $e) {
            DB::rollBack();
            throw $e;
        }
    }

    public function show(string $id)
    {
        $recipe = Recipe::with(['item', 'recipeItems.ingredient'])->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $recipe,
        ]);
    }

    public function update(Request $request, string $id)
    {
        $recipe = Recipe::with('recipeItems')->findOrFail($id);

        $validated = $request->validate([
            'item_id' => ['required', 'exists:items,id'],
            'version' => ['nullable', 'integer'],
            'yield_quantity' => ['required', 'numeric'],
            'note' => ['nullable', 'string'],
            'is_active' => ['nullable', 'boolean'],
            'recipe_items' => ['required', 'array', 'min:1'],
            'recipe_items.*.ingredient_item_id' => ['required', 'exists:items,id'],
            'recipe_items.*.quantity' => ['required', 'numeric'],
            'recipe_items.*.unit' => ['required', 'string'],
            'recipe_items.*.waste_rate' => ['nullable', 'numeric'],
        ]);

        DB::beginTransaction();

        try {
            $recipe->update([
                'item_id' => $validated['item_id'],
                'version' => $validated['version'] ?? 1,
                'yield_quantity' => $validated['yield_quantity'],
                'note' => $validated['note'] ?? null,
                'is_active' => $validated['is_active'] ?? true,
            ]);

            $recipe->recipeItems()->delete();

            foreach ($validated['recipe_items'] as $recipeItem) {
                RecipeItem::create([
                    'recipe_id' => $recipe->id,
                    'ingredient_item_id' => $recipeItem['ingredient_item_id'],
                    'quantity' => $recipeItem['quantity'],
                    'unit' => $recipeItem['unit'],
                    'waste_rate' => $recipeItem['waste_rate'] ?? null,
                ]);
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Cập nhật recipe thành công',
                'data' => $recipe->load(['item', 'recipeItems.ingredient']),
            ]);
        } catch (\Throwable $e) {
            DB::rollBack();
            throw $e;
        }
    }

    public function destroy(string $id)
    {
        $recipe = Recipe::findOrFail($id);
        $recipe->delete();

        return response()->json([
            'success' => true,
            'message' => 'Xóa recipe thành công',
        ]);
    }
}