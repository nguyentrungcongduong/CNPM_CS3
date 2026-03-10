<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Item;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ItemController extends Controller
{
    public function index(Request $request)
    {
        $query = Item::query();

        if ($request->filled('keyword')) {
            $keyword = $request->keyword;
            $query->where(function ($q) use ($keyword) {
                $q->where('code', 'like', "%{$keyword}%")
                  ->orWhere('name', 'like', "%{$keyword}%");
            });
        }

        if ($request->filled('type')) {
            $query->where('type', $request->type);
        }

        $items = $query->latest()->paginate(10);

        return response()->json([
            'success' => true,
            'data' => $items,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'code' => ['required', 'string', 'max:255', 'unique:items,code'],
            'name' => ['required', 'string', 'max:255'],
            'type' => ['required', 'string', 'max:255'],
            'unit' => ['required', 'string', 'max:50'],
            'default_price' => ['nullable', 'numeric'],
            'shelf_life_days' => ['nullable', 'integer'],
            'min_stock' => ['nullable', 'numeric'],
            'description' => ['nullable', 'string'],
            'status' => ['required', 'string'],
        ]);

        $item = Item::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Tạo item thành công',
            'data' => $item,
        ], 201);
    }

    public function show(string $id)
    {
        $item = Item::findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $item,
        ]);
    }

    public function update(Request $request, string $id)
    {
        $item = Item::findOrFail($id);

        $validated = $request->validate([
            'code' => ['required', 'string', 'max:255', Rule::unique('items', 'code')->ignore($item->id)],
            'name' => ['required', 'string', 'max:255'],
            'type' => ['required', 'string', 'max:255'],
            'unit' => ['required', 'string', 'max:50'],
            'default_price' => ['nullable', 'numeric'],
            'shelf_life_days' => ['nullable', 'integer'],
            'min_stock' => ['nullable', 'numeric'],
            'description' => ['nullable', 'string'],
            'status' => ['required', 'string'],
        ]);

        $item->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Cập nhật item thành công',
            'data' => $item,
        ]);
    }

    public function destroy(string $id)
    {
        $item = Item::findOrFail($id);
        $item->delete();

        return response()->json([
            'success' => true,
            'message' => 'Xóa item thành công',
        ]);
    }
}