<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Role;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    /**
     * GET /api/admin/users
     */
    public function index(Request $request)
    {
        $query = User::with(['role', 'store', 'warehouse']);

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('full_name', 'like', "%$search%")
                  ->orWhere('email', 'like', "%$search%")
                  ->orWhere('username', 'like', "%$search%");
            });
        }

        if ($request->filled('role_id')) {
            $query->where('role_id', $request->role_id);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $users = $query->orderByDesc('created_at')
                       ->paginate($request->get('per_page', 15));

        return response()->json([
            'success' => true,
            'data' => $users,
        ]);
    }

    /**
     * POST /api/admin/users
     */
    public function store(Request $request)
    {
        $request->validate([
            'full_name' => 'required|string|max:255',
            'email'     => 'required|email|unique:users,email',
            'username'  => 'required|string|unique:users,username',
            'password'  => 'required|string|min:6',
            'role_id'   => 'required|exists:roles,id',
            'phone'     => 'nullable|string|max:20',
            'store_id'  => 'nullable|exists:stores,id',
            'warehouse_id' => 'nullable|exists:warehouses,id',
            'status'    => ['nullable', Rule::in(['ACTIVE', 'INACTIVE'])],
        ]);

        $roleCode = Role::where('id', $request->role_id)->value('code');

        $user = User::create([
            'full_name'    => $request->full_name,
            'email'        => $request->email,
            'username'     => $request->username,
            'password'     => Hash::make($request->password),
            'role_id'      => $request->role_id,
            'phone'        => $request->phone,
            'store_id'     => $roleCode === 'KITCHEN_STAFF' ? null : $request->store_id,
            'warehouse_id' => $request->warehouse_id,
            'status'       => $request->status ?? 'ACTIVE',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Tạo người dùng thành công.',
            'data'    => $user->load(['role', 'store', 'warehouse']),
        ], 201);
    }

    /**
     * GET /api/admin/users/{id}
     */
    public function show($id)
    {
        $user = User::with(['role', 'store', 'warehouse'])->findOrFail($id);

        return response()->json([
            'success' => true,
            'data'    => $user,
        ]);
    }

    /**
     * PUT /api/admin/users/{id}
     */
    public function update(Request $request, $id)
    {
        $user = User::findOrFail($id);

        $request->validate([
            'full_name' => 'sometimes|required|string|max:255',
            'email'     => ['sometimes', 'required', 'email', Rule::unique('users', 'email')->ignore($user->id)],
            'username'  => ['sometimes', 'required', 'string', Rule::unique('users', 'username')->ignore($user->id)],
            'password'  => 'nullable|string|min:6',
            'role_id'   => 'sometimes|required|exists:roles,id',
            'phone'     => 'nullable|string|max:20',
            'store_id'  => 'nullable|exists:stores,id',
            'warehouse_id' => 'nullable|exists:warehouses,id',
            'status'    => ['nullable', Rule::in(['ACTIVE', 'INACTIVE'])],
        ]);

        $data = $request->only(['full_name', 'email', 'username', 'role_id', 'phone', 'store_id', 'warehouse_id', 'status']);

        if ($request->filled('password')) {
            $data['password'] = Hash::make($request->password);
        }

        $roleId = $data['role_id'] ?? $user->role_id;
        $roleCode = Role::where('id', $roleId)->value('code');
        if ($roleCode === 'KITCHEN_STAFF') {
            $data['store_id'] = null;
        }

        $user->update($data);

        return response()->json([
            'success' => true,
            'message' => 'Cập nhật người dùng thành công.',
            'data'    => $user->load(['role', 'store', 'warehouse']),
        ]);
    }

    /**
     * DELETE /api/admin/users/{id}
     */
    public function destroy($id)
    {
        $user = User::findOrFail($id);

        // Soft delete by setting status to INACTIVE
        $user->update(['status' => 'INACTIVE']);

        return response()->json([
            'success' => true,
            'message' => 'Tài khoản đã bị vô hiệu hóa.',
        ]);
    }
}
