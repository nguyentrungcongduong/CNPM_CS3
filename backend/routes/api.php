<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\StoreController;
use App\Http\Controllers\Api\KitchenController;
use App\Http\Controllers\Api\RoleController;
use App\Http\Controllers\Api\ManagerInventoryController;
use App\Http\Controllers\Api\ManagerOrderController;
use App\Http\Controllers\Api\StoreInventoryController;
use App\Http\Controllers\Api\StoreOrderController;
use App\Http\Controllers\Api\ItemController;
use App\Http\Controllers\Api\RecipeController;
use App\Http\Controllers\Api\CoordinatorOrderController;
use App\Http\Controllers\Api\KitchenOrderController;
use App\Http\Controllers\Api\KitchenProductionController;

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

        // Quản lý Lô hàng (Batch)
        Route::get('/batches', [\App\Http\Controllers\Api\BatchController::class, 'index']);
        Route::post('/batches', [\App\Http\Controllers\Api\BatchController::class, 'store']);
        Route::get('/batches/{batch_code}', [\App\Http\Controllers\Api\BatchController::class, 'show']);

        // Quản lý đơn đặt hàng từ cửa hàng (legacy approve/reject giữ lại)
        Route::get('/orders', [ManagerOrderController::class, 'index']);
        Route::patch('/orders/{id}/approve', [ManagerOrderController::class, 'approve']);
        Route::patch('/orders/{id}/reject', [ManagerOrderController::class, 'reject']);
    });

    // ---- Supply Coordinator Routes ----
    // GET  /api/coordinator/orders/summary            → aggregate demand
    // GET  /api/coordinator/orders                    → list orders
    // PUT  /api/coordinator/orders/{id}/confirm       → SUBMITTED → CONFIRMED
    // PUT  /api/coordinator/orders/{id}/reject        → SUBMITTED → REJECTED
    // PUT  /api/coordinator/orders/{id}/cancel        → CONFIRMED → CANCELLED
    // PUT  /api/coordinator/orders/{id}/adjust-quantities → update approved_quantity per item
    Route::prefix('coordinator')->group(function () {
        Route::get('/orders/summary', [CoordinatorOrderController::class, 'summary']);
        Route::get('/orders', [CoordinatorOrderController::class, 'index']);
        Route::put('/orders/{id}/confirm', [CoordinatorOrderController::class, 'confirm']);
        Route::put('/orders/{id}/reject', [CoordinatorOrderController::class, 'reject']);
        Route::put('/orders/{id}/cancel', [CoordinatorOrderController::class, 'cancel']);
        Route::put('/orders/{id}/adjust-quantities', [CoordinatorOrderController::class, 'adjustQuantities']);
    });

    // ---- Kitchen Routes ----
    // PUT /api/kitchen/orders/{id}/status  →  advance status through production lifecycle
    Route::prefix('kitchen')->group(function () {
        Route::get('/orders', [KitchenOrderController::class, 'index']);
        Route::get('/orders/{id}', [KitchenOrderController::class, 'show']);
        Route::put('/orders/{id}/status', [KitchenOrderController::class, 'updateStatus']);

        // Production Plans
        Route::get('/production-plan', [KitchenProductionController::class, 'index']);
        Route::post('/production-plan', [KitchenProductionController::class, 'store']);
        Route::get('/production-plan/{id}/ingredients', [KitchenProductionController::class, 'checkIngredients']);
        Route::put('/production/{id}/status', [KitchenProductionController::class, 'updateStatus']);
    });

    // ---- Store Routes ----
    Route::prefix('store')->group(function () {
        // Tồn kho của một cửa hàng
        Route::get('/inventory/{store_id}', [StoreInventoryController::class, 'show']);
        Route::get('/inventory/{store_id}/transactions', [StoreInventoryController::class, 'transactions']);

        // Đơn hàng của cửa hàng
        Route::get('/orders', [StoreOrderController::class, 'index']);
        Route::post('/orders', [StoreOrderController::class, 'store']);
        Route::get('/orders/{id}', [StoreOrderController::class, 'show']);

        // Store submit đơn DRAFT → SUBMITTED
        Route::put('/orders/{id}/submit', [StoreOrderController::class, 'submit']);

        // Store cancel đơn (DRAFT hoặc SUBMITTED)
        Route::put('/orders/{id}/cancel', [StoreOrderController::class, 'cancel']);
    });
});