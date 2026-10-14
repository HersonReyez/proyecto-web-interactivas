<?php

namespace App\Http\Controllers;

use App\Http\Requests\AuthRequest;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function register(AuthRequest $request): JsonResponse
    {
        $user = User::create([...$request->safe()->only(['name', 'email', 'password']), 'role' => 'cliente']);
        Auth::guard('web')->login($user);
        $request->session()->regenerate();

        return response()->json(['user' => $user, 'message' => 'Tu cuenta está lista.'], 201);
    }

    public function login(AuthRequest $request): JsonResponse
    {
        if (! Auth::guard('web')->attempt($request->safe()->only(['email', 'password']))) {
            throw ValidationException::withMessages(['email' => 'El correo o la contraseña no son correctos.']);
        }
        $request->session()->regenerate();

        return response()->json(['user' => Auth::guard('web')->user()]);
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json(['user' => $request->user()]);
    }

    public function logout(Request $request): JsonResponse
    {
        Auth::guard('web')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json(['message' => 'Sesión cerrada.']);
    }
}
