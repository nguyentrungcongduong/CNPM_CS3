<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;

Route::post('/login', [AuthController::class, 'login']);
Route::post('/logout', [AuthController::class, 'logout']);
Route::get('/me', [AuthController::class, 'me']);
/*
|--------------------------------------------------------------------------
| RBAC TEST ROUTES
|--------------------------------------------------------------------------
*/

Route::get('/admin-only', function () {
    return response()->json([
        'message' => 'Welcome Admin',
    ]);
})->middleware('role:ADMIN');

Route::get('/manager-only', function () {
    return response()->json([
        'message' => 'Welcome Manager',
    ]);
})->middleware('role:MANAGER');

Route::get('/store-or-admin', function () {
    return response()->json([
        'message' => 'Welcome Store Staff or Admin',
    ]);
})->middleware('role:STORE_STAFF,ADMIN');

use App\Http\Controllers\Api\ItemController;

Route::apiResource('items', ItemController::class);

use App\Http\Controllers\Api\RecipeController;

Route::apiResource('recipes', RecipeController::class);