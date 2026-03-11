<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Role;

class RoleController extends Controller
{
    /**
     * GET /api/admin/roles
     * Returns all roles for dropdowns
     */
    public function index()
    {
        $roles = Role::select('id', 'code', 'name')->orderBy('name')->get();

        return response()->json([
            'success' => true,
            'data'    => $roles,
        ]);
    }
}
