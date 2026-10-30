<?php

namespace App\Http\Controllers;

use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

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
        $product->stock = $request->stock;
        $product->anime_id = $request->anime_id ?: null;
        $product->anime_title = $request->anime_title ?: null;
        $product->anime_image_url = $request->anime_image_url ?: null;

        // Lógica para guardar la imagen
        if ($request->hasFile('image')) {
            // Guarda en storage/app/public/products
            $path = $request->file('image')->store('products', 'public');
            $product->image_path = $path;
        }

        $product->save();
        return $product;
    }

    // Editar producto
    public function update(Request $request){
        $product = Product::findOrFail($request->id);
        $product->name = $request->name;
        $product->description = $request->description;
        $product->price = $request->price;
        $product->stock = $request->stock;

        if ($request->has('anime_id')) {
            $product->anime_id = $request->anime_id ?: null;
        }
        if ($request->has('anime_title')) {
            $product->anime_title = $request->anime_title ?: null;
        }
        if ($request->has('anime_image_url')) {
            $product->anime_image_url = $request->anime_image_url ?: null;
        }

        // Actualizar imagen si se envía una nueva
        if ($request->hasFile('image')) {
            // Eliminar la imagen anterior si existe
            if ($product->image_path) {
                Storage::disk('public')->delete($product->image_path);
            }
            $path = $request->file('image')->store('products', 'public');
            $product->image_path = $path;
        }

        $product->save();
        return $product;
    }
    
    // Borrar producto
    public function destroy($id){
        $product = Product::destroy($id);
        return $product;
    }
}
