<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Warehouse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class KitchenController extends Controller
{
    /**
     * GET /api/admin/kitchens
     * Kitchens = Warehouses với type = KITCHEN
     */
    public function index(Request $request)
    {
        $query = Warehouse::with('store')->where('type', 'KITCHEN');

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%$search%")
                  ->orWhere('code', 'like', "%$search%")
                  ->orWhere('address', 'like', "%$search%");
            });
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $kitchens = $query->orderByDesc('created_at')
                          ->paginate($request->get('per_page', 15));

        return response()->json([
            'success' => true,
            'data' => $kitchens,
        ]);
    }

    /**
     * POST /api/admin/kitchens
     */
    public function store(Request $request)
    {
        $request->validate([
            'code'     => 'required|string|max:50|unique:warehouses,code',
            'name'     => 'required|string|max:255',
            'address'  => 'nullable|string',
            'store_id' => 'nullable|exists:stores,id',
            'status'   => ['nullable', Rule::in(['ACTIVE', 'INACTIVE'])],
        ]);

        $kitchen = Warehouse::create([
            'code'     => strtoupper($request->code),
            'name'     => $request->name,
            'type'     => 'KITCHEN',
            'address'  => $request->address,
            'store_id' => $request->store_id,
            'status'   => $request->status ?? 'ACTIVE',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Tạo bếp trung tâm thành công.',
            'data'    => $kitchen->load('store'),
        ], 201);
    }

    /**
     * GET /api/admin/kitchens/{id}
     */
    public function show($id)
    {
        $kitchen = Warehouse::with(['store', 'users.role'])
                            ->where('type', 'KITCHEN')
                            ->findOrFail($id);

        return response()->json([
            'success' => true,
            'data'    => $kitchen,
        ]);
    }

    /**
     * PUT /api/admin/kitchens/{id}
     */
    public function update(Request $request, $id)
    {
        $kitchen = Warehouse::where('type', 'KITCHEN')->findOrFail($id);

        $request->validate([
            'code'     => ['sometimes', 'required', 'string', 'max:50', Rule::unique('warehouses', 'code')->ignore($kitchen->id)],
            'name'     => 'sometimes|required|string|max:255',
            'address'  => 'nullable|string',
            'store_id' => 'nullable|exists:stores,id',
            'status'   => ['nullable', Rule::in(['ACTIVE', 'INACTIVE'])],
        ]);

        $kitchen->update($request->only(['code', 'name', 'address', 'store_id', 'status']));

        return response()->json([
            'success' => true,
            'message' => 'Cập nhật bếp trung tâm thành công.',
            'data'    => $kitchen->load('store'),
        ]);
    }

    /**
     * DELETE /api/admin/kitchens/{id}
     */
    public function destroy($id)
    {
        $kitchen = Warehouse::where('type', 'KITCHEN')->findOrFail($id);
        $kitchen->update(['status' => 'INACTIVE']);

        return response()->json([
            'success' => true,
            'message' => 'Bếp trung tâm đã bị vô hiệu hóa.',
        ]);
    }
}
