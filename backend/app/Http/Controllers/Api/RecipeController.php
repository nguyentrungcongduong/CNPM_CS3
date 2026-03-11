<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Recipe;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;

class RecipeController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $recipes = Recipe::with('recipeItems.item')->get();
        return response()->json($recipes);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'code' => 'required|string|unique:recipes',
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'status' => 'nullable|string',
            'ingredients' => 'nullable|array',
            'ingredients.*.item_id' => 'required|exists:items,id',
            'ingredients.*.quantity' => 'required|numeric|min:0',
        ]);

        DB::beginTransaction();
        try {
            $recipe = Recipe::create([
                'code' => $validated['code'],
                'name' => $validated['name'],
                'description' => $validated['description'] ?? null,
                'status' => $validated['status'] ?? 'ACTIVE',
            ]);

            if (!empty($validated['ingredients'])) {
                $syncData = [];
                foreach ($validated['ingredients'] as $ingredient) {
                    $syncData[$ingredient['item_id']] = ['quantity' => $ingredient['quantity']];
                }
                $recipe->items()->sync($syncData);
            }

            DB::commit();
            return response()->json($recipe->load('recipeItems.item'), Response::HTTP_CREATED);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => 'Failed to create recipe.', 'message' => $e->getMessage()], 500);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show($id)
    {
        $recipe = Recipe::with('recipeItems.item')->findOrFail($id);
        return response()->json($recipe);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, $id)
    {
        $recipe = Recipe::findOrFail($id);

        $validated = $request->validate([
            'code' => 'sometimes|required|string|unique:recipes,code,' . $recipe->id,
            'name' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
            'status' => 'nullable|string',
            'ingredients' => 'nullable|array',
            'ingredients.*.item_id' => 'required|exists:items,id',
            'ingredients.*.quantity' => 'required|numeric|min:0',
        ]);

        DB::beginTransaction();
        try {
            $updateData = [];
            if (isset($validated['code'])) $updateData['code'] = $validated['code'];
            if (isset($validated['name'])) $updateData['name'] = $validated['name'];
            if (array_key_exists('description', $validated)) $updateData['description'] = $validated['description'];
            if (isset($validated['status'])) $updateData['status'] = $validated['status'];
            
            $recipe->update($updateData);

            if (isset($validated['ingredients'])) {
                $syncData = [];
                foreach ($validated['ingredients'] as $ingredient) {
                    $syncData[$ingredient['item_id']] = ['quantity' => $ingredient['quantity']];
                }
                $recipe->items()->sync($syncData);
            }

            DB::commit();
            return response()->json($recipe->load('recipeItems.item'));
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => 'Failed to update recipe.', 'message' => $e->getMessage()], 500);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy($id)
    {
        $recipe = Recipe::findOrFail($id);
        $recipe->delete();

        return response()->json(null, Response::HTTP_NO_CONTENT);
    }
}
