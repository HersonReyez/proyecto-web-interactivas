<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\AuthController;

// ==========================================
// RUTAS PÚBLICAS
// ==========================================

Route::post('register', [AuthController::class, 'register']);
Route::post('login', [AuthController::class, 'login']);
Route::get('products', [ProductController::class, 'index']);
Route::get('product/{id}', [ProductController::class, 'show']);

// ==========================================
// RUTAS PROTEGIDAS (Requieren Token Sanctum)
// ==========================================
Route::middleware(['auth:sanctum'])->group(function () {

    Route::get('logout', [AuthController::class, 'logout']);
    Route::get('bienvenida', [AuthController::class, 'bienvenida']);

    // ==========================================
    // RUTAS EXCLUSIVAS ADMIN
    // ==========================================
    Route::middleware('admin')->group(function(){
        
    Route::get('bienvenidaAdmin', [AuthController::class, 'bienvenidaAdmin']);
        Route::post('product', [ProductController::class, 'store']);
        Route::put('product/{id}', [ProductController::class, 'update']);
        Route::delete('product/{id}', [ProductController::class, 'destroy']);

    });
});