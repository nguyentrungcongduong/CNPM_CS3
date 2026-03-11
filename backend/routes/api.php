<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\StoreController;
use App\Http\Controllers\Api\KitchenController;
use App\Http\Controllers\Api\RoleController;
use App\Http\Controllers\Api\ManagerInventoryController;
use App\Http\Controllers\Api\StoreInventoryController;
use App\Http\Controllers\Api\ItemController;
use App\Http\Controllers\Api\RecipeController;

// Public routes
Route::post('/login', [AuthController::class, 'login']);

// Protected routes
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);

    // ---- Admin Routes ----
    Route::prefix('admin')->group(function () {
        Route::get('/roles', [RoleController::class, 'index']);
        Route::get('/stores/list', [StoreController::class, 'list']);
        Route::apiResource('/stores', StoreController::class);
        Route::apiResource('/users', UserController::class);
        Route::apiResource('/kitchens', KitchenController::class);
        Route::apiResource('/items', ItemController::class);
        Route::apiResource('/recipes', RecipeController::class);
    });

    // ---- Manager Routes ----
    Route::prefix('manager')->group(function () {
        // Tồn kho Bếp Trung Tâm
        Route::get('/inventory', [ManagerInventoryController::class, 'index']);
        Route::get('/inventory/transactions', [ManagerInventoryController::class, 'transactions']);
    });

    // ---- Store Routes ----
    Route::prefix('store')->group(function () {
        // Tồn kho của một cửa hàng
        Route::get('/inventory/{store_id}', [StoreInventoryController::class, 'show']);
        Route::get('/inventory/{store_id}/transactions', [StoreInventoryController::class, 'transactions']);
    });
});