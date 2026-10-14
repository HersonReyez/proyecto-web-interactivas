<?php

namespace App\Http\Controllers;

use App\Http\Requests\UpdateProfileRequest;
use Illuminate\Http\JsonResponse;

class ProfileController extends Controller
{
    public function update(UpdateProfileRequest $request): JsonResponse
    {
        $user = $request->user();
        $data = $request->safe()->only(['name', 'email']);
        if ($data['email'] !== $user->email) {
            $data['email_verified_at'] = null;
        }
        if ($request->filled('password')) {
            $data['password'] = $request->validated('password');
        }
        $user->forceFill($data)->save();

        return response()->json(['user' => $user, 'message' => 'Tu perfil se actualizó.']);
    }
}
