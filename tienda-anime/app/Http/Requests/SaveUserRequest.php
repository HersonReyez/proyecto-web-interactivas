<?php

namespace App\Http\Requests;

use Illuminate\Validation\Rule;

class SaveUserRequest extends AccountRequest
{
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', Rule::unique('users')->ignore($this->route('user'))],
            'role' => ['required', Rule::in(['admin', 'cliente'])],
            'password' => [$this->isMethod('POST') ? 'required' : 'nullable', 'string', 'min:8', 'max:72', 'confirmed'],
        ];
    }
}
