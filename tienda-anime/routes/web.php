<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return response()->json(['name' => 'Anime Store API', 'frontend' => 'http://localhost:5173']);
});
