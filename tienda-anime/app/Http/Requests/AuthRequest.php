<?php

namespace App\Http\Requests;

class AuthRequest extends AccountRequest
{
    public function authorize(): bool
    {
        return $this->hasSession();
    }

    public function rules(): array
    {
        if ($this->routeIs('auth.register')) {
            return [
                'name' => ['required', 'string', 'max:255'],
                'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
                'password' => ['required', 'string', 'min:8', 'max:72', 'confirmed'],
            ];
        }
        return [
            'email' => ['required', 'string', 'email', 'max:255'],
            'password' => ['required', 'string', 'max:72'],
        ];
    }
}
