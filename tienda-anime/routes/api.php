<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\CartController;
use Illuminate\Support\Facades\Route;

######################
# RUTAS PUBLICAS
######################

Route::post('register', [AuthController::class, 'register'])->middleware('throttle:registration')->name('auth.register');
Route::post('login', [AuthController::class, 'login'])->middleware('throttle:login')->name('auth.login');
Route::get('products', [ProductController::class, 'index']);
Route::get('product/{id}', [ProductController::class, 'show']);

######################
# RUTAS USUARIOS
######################

Route::middleware('auth:sanctum')->group(function () {

    Route::get('me', [AuthController::class, 'me']);
    Route::post('logout', [AuthController::class, 'logout']);
    Route::put('profile', [ProfileController::class, 'update']);

    Route::get('cart', [CartController::class, 'index']);
    Route::post('cart/{productId}', [CartController::class, 'store']);
    Route::delete('cart/{productId}/unit', [CartController::class, 'removeOne']);
    Route::delete('cart/{productId}', [CartController::class, 'destroy']);

    ######################
    # RUTAS USUARIOS
    ######################

    Route::middleware('admin')->group(function () {
        Route::apiResource('users', UserController::class)->except('show');
        Route::post('product', [ProductController::class, 'store']);
        Route::put('product/{id}', [ProductController::class, 'update']);
        Route::delete('product/{id}', [ProductController::class, 'destroy']);
    });
});
