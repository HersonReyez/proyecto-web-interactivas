<?php

namespace App\Http\Requests;

use Illuminate\Validation\Rule;

class UpdateProfileRequest extends AccountRequest
{
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', Rule::unique('users')->ignore($this->user())],
            'password' => ['nullable', 'string', 'min:8', 'max:72', 'confirmed'],
            'current_password' => [Rule::requiredIf($this->filled('password') || $this->input('email') !== $this->user()->email), 'nullable', 'string', 'current_password:web'],
        ];
    }
}
