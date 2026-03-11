<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\StoreController;
use App\Http\Controllers\Api\KitchenController;
use App\Http\Controllers\Api\RoleController;

// Public routes
Route::post('/login', [AuthController::class, 'login']);

// Protected routes
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);

    // ---- Admin Routes ----
    Route::prefix('admin')->group(function () {
        // Roles (read-only, for dropdowns)
        Route::get('/roles', [RoleController::class, 'index']);

        // Stores
        Route::get('/stores/list', [StoreController::class, 'list']);
        Route::apiResource('/stores', StoreController::class);

        // Users
        Route::apiResource('/users', UserController::class);

        // Kitchens (Central Kitchen = Warehouse type KITCHEN)
        Route::apiResource('/kitchens', KitchenController::class);
    });
});