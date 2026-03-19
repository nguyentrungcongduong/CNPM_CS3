<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * POST /api/login
     */
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required_without:username|string',
            'username' => 'required_without:email|string',
            'password' => 'required',
        ]);

        $loginField = $request->input('email') ?? $request->input('username');

        $user = User::where('email', $loginField)
            ->orWhere('username', $loginField)
            ->first();

        if (! $user || ! Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'username' => ['Thông tin đăng nhập không chính xác.']
            ]);
        }

        if ($user->status !== 'ACTIVE') {
            return response()->json([
                'message' => 'Tài khoản của bạn đã bị khóa.'
            ], 403);
        }

        // Tạo token qua Sanctum
        $token = $user->createToken('auth_token')->plainTextToken;

        $user->update(['last_login_at' => now()]);

        return response()->json([
            'access_token' => $token,
            'token_type' => 'Bearer',
            'user' => $user->load(['role', 'store', 'warehouse']),
        ]);
    }

    /**
     * POST /api/logout
     */
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Đã đăng xuất thành công.'
        ]);
    }

    /**
     * GET /api/me
     */
    public function me(Request $request)
    {
        return response()->json($request->user()->load(['role', 'store', 'warehouse']));
    }

    /**
     * POST /api/push-token
     * Mobile app gọi sau khi login để lưu Expo Push Token
     */
    public function registerPushToken(Request $request)
    {
        $validated = $request->validate([
            'expo_push_token' => 'required|string|starts_with:ExponentPushToken[',
        ]);

        $request->user()->update([
            'expo_push_token' => $validated['expo_push_token'],
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Push token đã được lưu.',
        ]);
    }

    /**
     * DELETE /api/push-token
     * Xóa push token khi logout (tránh gửi notification cho user đã logout)
     */
    public function removePushToken(Request $request)
    {
        $request->user()->update(['expo_push_token' => null]);

        return response()->json([
            'success' => true,
            'message' => 'Push token đã được xóa.',
        ]);
    }
}