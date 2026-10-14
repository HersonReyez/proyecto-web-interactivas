<?php

namespace App\Http\Controllers;

use App\Http\Requests\SaveUserRequest;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class UserController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $filters = $request->validate([
            'search' => ['nullable', 'string', 'max:255'],
            'role' => ['nullable', Rule::in(['admin', 'cliente'])],
            'page' => ['nullable', 'integer', 'min:1'],
        ]);
        $users = User::query()
            ->when($filters['search'] ?? null, fn ($query, $search) => $query->where(fn ($query) => $query
                ->where('name', 'like', '%'.$search.'%')->orWhere('email', 'like', '%'.$search.'%')))
            ->when($filters['role'] ?? null, fn ($query, $role) => $query->where('role', $role))
            ->latest('id')->paginate(10);

        return response()->json([
            ...$users->toArray(),
            'stats' => ['total' => User::count(), 'admins' => User::where('role', 'admin')->count(), 'clients' => User::where('role', 'cliente')->count()],
        ]);
    }

    public function store(SaveUserRequest $request): JsonResponse
    {
        $user = User::create($request->safe()->only(['name', 'email', 'role', 'password']));

        return response()->json(['user' => $user, 'message' => 'Usuario creado.'], 201);
    }

    public function update(SaveUserRequest $request, User $user): JsonResponse
    {
        DB::transaction(function () use ($request, $user) {
            // Serialize changes to administrators to preserve at least one admin.
            $admins = User::where('role', 'admin')->orderBy('id')->lockForUpdate()->get();
            abort_unless($admins->contains('id', $request->user()->id), 403);
            $user->refresh();
            $data = $request->safe()->only(['name', 'email', 'role']);
            if ($user->is($request->user()) && $data['role'] !== $user->role) {
                throw ValidationException::withMessages(['role' => 'No puedes cambiar tu propio rol.']);
            }
            if ($user->role === 'admin' && $data['role'] !== 'admin' && $admins->count() <= 1) {
                throw ValidationException::withMessages(['role' => 'Debe permanecer al menos un administrador.']);
            }
            if ($data['email'] !== $user->email) {
                $data['email_verified_at'] = null;
            }
            if ($request->filled('password')) {
                $data['password'] = $request->validated('password');
            }
            $user->forceFill($data)->save();
            if ($user->is($request->user())) {
                $request->user()->refresh();
            }
        });

        return response()->json(['user' => $user, 'message' => 'Usuario actualizado.']);
    }

    public function destroy(Request $request, User $user): JsonResponse
    {
        DB::transaction(function () use ($request, $user) {
            $admins = User::where('role', 'admin')->orderBy('id')->lockForUpdate()->get();
            abort_unless($admins->contains('id', $request->user()->id), 403);
            $user->refresh();
            if ($user->is($request->user())) {
                throw ValidationException::withMessages(['user' => 'No puedes eliminar tu propia cuenta desde este panel.']);
            }
            if ($user->role === 'admin' && $admins->count() <= 1) {
                throw ValidationException::withMessages(['user' => 'Debe permanecer al menos un administrador.']);
            }
            $user->tokens()->delete();
            $user->delete();
        });

        return response()->json(['message' => 'Usuario eliminado.']);
    }
}
