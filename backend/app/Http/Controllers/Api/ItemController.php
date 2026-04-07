<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Item;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Validation\ValidationException;

class ItemController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        // Master catalog is chain-wide — never scope by user's store.
        // `store_id` (if sent by clients) is intentionally ignored.
        $query = Item::query();

        // Search by name or code
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%$search%")
                    ->orWhere('code', 'like', "%$search%");
            });
        }

        // Filter by type
        if ($request->filled('type')) {
            $query->where('type', $request->type);
        }

        // Filter by status
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $items = $query->orderBy('created_at', 'desc')->get();
        return response()->json([
            'success' => true,
            'data' => $items
        ]);
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
     * Use soft delete and check if item is being used.
     */
    public function destroy($id)
    {
        $item = Item::findOrFail($id);

        // Kiểm tra xem hàng hóa đang được sử dụng chưa
        if ($item->inventories()->exists()) {
            throw ValidationException::withMessages([
                'message' => 'Không thể xóa — hàng đang có trong tồn kho'
            ]);
        }

        if ($item->orderItems()->exists()) {
            throw ValidationException::withMessages([
                'message' => 'Không thể xóa — hàng đang được sử dụng trong đơn hàng'
            ]);
        }

        // Soft delete
        $item->delete();

        return response()->json([
            'success' => true,
            'message' => 'Đã xóa hàng hóa thành công'
        ]);
    }
}
