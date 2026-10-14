<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckRole
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Verifica si está logeado y si su rol es admin
        if($request->user() && $request->user()->role == 'admin'){
            return $next($request);
        }
        return response()->json(['message' => 'Acceso denegado: Se requiere rol de administrador'], 403);
    }
}
