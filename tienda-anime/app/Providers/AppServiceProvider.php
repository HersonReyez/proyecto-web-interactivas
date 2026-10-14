<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        RateLimiter::for('login', fn (Request $request) => [
            Limit::perMinute(30)->by($request->ip()),
            Limit::perMinute(5)->by(mb_strtolower(is_string($request->input('email')) ? $request->input('email') : '').'|'.$request->ip()),
        ]);
        RateLimiter::for('registration', fn (Request $request) => Limit::perMinute(5)->by($request->ip()));
    }
}
