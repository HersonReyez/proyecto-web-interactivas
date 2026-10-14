<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth ;
use Validator;
use App\Models\User;
use \stdClass;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    //
    public function register(Request $request){
        $validator = Validator::make($request->all(),[
            'name' => 'required|string|max:255',
            'email' => 'required|string|max:255|unique:users',
            'password' => 'required|string|min:8'
        ]);

        if($validator->fails()){
            return response()->json($validator->errors());
        }

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password)
        ]);

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'data' => $user,
            'access_token' => $token,
            'token_type' => 'Bearer',
        ]);
    }

    public function login(Request $request){
        if(!Auth::attempt($request->only('email', 'password'))){
            return response()->json(["Unauthorized"], 401);
        }

        $user = User::where('email', $request['email'])->firstOrFail();

        $token = $user->createToken('auth_token')->plainTextToken;
        
        return response()->json([
            'message' => 'Hi'.$user->name,
            'access_token' => $token,
            'token_type' => 'Bearer',
            'user' => $user,
        ]);
    }

    public function logout(Request $request){
        auth()->user()->tokens()->delete();

        return [
            'meesage' => 'You have successfuly logged out and the token was successfully deleted'
        ];
    }

    // Función de prueba login
    public function bienvenida(Request $request){
        $user = $request->user();

        return response()->json(['meesage' => 'Bienvenido '.$user->name]);
    }

    // Función de prueba Rol Admin
    public function bienvenidaAdmin(Request $request){
        return response()->json(['meesage' => 'Bienvenido Administrador!']);
    }
}
