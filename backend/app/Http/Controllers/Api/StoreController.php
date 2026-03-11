<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Store;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class StoreController extends Controller
{
    /**
     * GET /api/admin/stores
     */
    public function index(Request $request)
    {
        $query = Store::withCount('users');

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

        $stores = $query->orderByDesc('created_at')
                        ->paginate($request->get('per_page', 15));

        return response()->json([
            'success' => true,
            'data' => $stores,
        ]);
    }

    /**
     * POST /api/admin/stores
     */
    public function store(Request $request)
    {
        $request->validate([
            'code'         => 'required|string|max:50|unique:stores,code',
            'name'         => 'required|string|max:255',
            'address'      => 'nullable|string',
            'phone'        => 'nullable|string|max:20',
            'manager_name' => 'nullable|string|max:255',
            'status'       => ['nullable', Rule::in(['ACTIVE', 'INACTIVE'])],
        ]);

        $store = Store::create([
            'code'         => strtoupper($request->code),
            'name'         => $request->name,
            'address'      => $request->address,
            'phone'        => $request->phone,
            'manager_name' => $request->manager_name,
            'status'       => $request->status ?? 'ACTIVE',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Tạo cửa hàng thành công.',
            'data'    => $store,
        ], 201);
    }

    /**
     * GET /api/admin/stores/{id}
     */
    public function show($id)
    {
        $store = Store::with(['users.role', 'warehouses'])->findOrFail($id);

        return response()->json([
            'success' => true,
            'data'    => $store,
        ]);
    }

    /**
     * PUT /api/admin/stores/{id}
     */
    public function update(Request $request, $id)
    {
        $store = Store::findOrFail($id);

        $request->validate([
            'code'         => ['sometimes', 'required', 'string', 'max:50', Rule::unique('stores', 'code')->ignore($store->id)],
            'name'         => 'sometimes|required|string|max:255',
            'address'      => 'nullable|string',
            'phone'        => 'nullable|string|max:20',
            'manager_name' => 'nullable|string|max:255',
            'status'       => ['nullable', Rule::in(['ACTIVE', 'INACTIVE'])],
        ]);

        $store->update($request->only(['code', 'name', 'address', 'phone', 'manager_name', 'status']));

        return response()->json([
            'success' => true,
            'message' => 'Cập nhật cửa hàng thành công.',
            'data'    => $store,
        ]);
    }

    /**
     * DELETE /api/admin/stores/{id}
     */
    public function destroy($id)
    {
        $store = Store::findOrFail($id);
        $store->update(['status' => 'INACTIVE']);

        return response()->json([
            'success' => true,
            'message' => 'Cửa hàng đã bị vô hiệu hóa.',
        ]);
    }

    /**
     * GET /api/admin/stores/list - Simple list for dropdowns
     */
    public function list()
    {
        $stores = Store::where('status', 'ACTIVE')
                       ->select('id', 'code', 'name')
                       ->orderBy('name')
                       ->get();

        return response()->json([
            'success' => true,
            'data'    => $stores,
        ]);
    }
}
