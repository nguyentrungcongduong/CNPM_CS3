<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Item;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class ItemController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $items = Item::all();
        return response()->json($items);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'code' => 'required|string|unique:items',
            'name' => 'required|string|max:255',
            'type' => 'required|string',
            'unit' => 'required|string',
            'default_price' => 'nullable|numeric',
            'shelf_life_days' => 'nullable|integer',
            'min_stock' => 'nullable|numeric',
            'description' => 'nullable|string',
            'status' => 'nullable|string',
        ]);

        $item = Item::create($validated);

        return response()->json($item, Response::HTTP_CREATED);
    }

    /**
     * Display the specified resource.
     */
    public function show($id)
    {
        $item = Item::findOrFail($id);
        return response()->json($item);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, $id)
    {
        $item = Item::findOrFail($id);

        $validated = $request->validate([
            'code' => 'sometimes|required|string|unique:items,code,' . $item->id,
            'name' => 'sometimes|required|string|max:255',
            'type' => 'sometimes|required|string',
            'unit' => 'sometimes|required|string',
            'default_price' => 'nullable|numeric',
            'shelf_life_days' => 'nullable|integer',
            'min_stock' => 'nullable|numeric',
            'description' => 'nullable|string',
            'status' => 'nullable|string',
        ]);

        $item->update($validated);

        return response()->json($item);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy($id)
    {
        $item = Item::findOrFail($id);
        $item->delete();

        return response()->json(null, Response::HTTP_NO_CONTENT);
    }
}
