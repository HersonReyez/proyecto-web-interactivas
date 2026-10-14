<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class ProductController extends Controller
{
    // Mostrar todos los productos
    public function index(){
        $product = Product::all();
        return $product;
    }

    // Mostrar producto
    public function show($id){
        $product = Product::find($id);
        return $product;
    }

    // CRUD PRODUCTOS //
    // Crear producto
    public function store(Request $request){
        $product = new Product();
        $product->name = $request->name;
        $product->description = $request->description;
        $product->price = $request->price;

        $product->save();
        return $product;
    }

    // Editar producto
    public function update(Request $request){
        $product = Product::findOrFail($request->id);
        $product->name = $request->name;
        $product->description = $request->description;
        $product->price = $request->price;

        $product->save();
        return $product;
    }
    
    // Borrar producto
    public function destroy($id){
        $product = Product::destroy($id);
        return $product;
    }
}
