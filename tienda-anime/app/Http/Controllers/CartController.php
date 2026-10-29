<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Product;
use Illuminate\Support\Facades\DB;

class CartController extends Controller
{
    public function index(Request $request){
        $user = $request->user();
        $carts = $user->carts()->get();
        
        return response()->json($carts);
    }

    public function store(Request $request, $productId){
        $user = $request->user();
        $product = Product::findOrFail($productId);
        
        // Permite recibir la cantidad por el body, si no se envía, asume 1
        $quantityToAdd = $request->input('quantity', 1);

        // Verificar que exista stock suficiente para la cantidad solicitada
        if ($product->stock < $quantityToAdd) {
            return response()->json(['message' => 'No hay stock suficiente para esta cantidad'], 400);
        }

        DB::transaction(function () use ($user, $product, $productId, $quantityToAdd) {
            // Buscamos si el producto ya existe en el carrito de este usuario
            $cartItem = $user->carts()->where('product_id', $productId)->first();

            if ($cartItem) {
                // Si existe, sumamos la cantidad actual + la nueva
                $newQuantity = $cartItem->pivot->quantity + $quantityToAdd;
                $user->carts()->updateExistingPivot($productId, ['quantity' => $newQuantity]);
            } else {
                // Si no existe, lo agregamos con la cantidad solicitada
                $user->carts()->attach($productId, ['quantity' => $quantityToAdd]);
            }

            // Descontamos del stock general del producto
            $product->decrement('stock', $quantityToAdd);
        });
        
        return response()->json(['message' => 'Producto agregado al carrito y stock actualizado']);
    }

    public function removeOne(Request $request, $productId){
        $user = $request->user();

        $remainingQuantity = DB::transaction(function () use ($user, $productId) {
            // Serializa la actualización de inventario y la cantidad reservada.
            $product = Product::whereKey($productId)->lockForUpdate()->firstOrFail();
            $cartItem = $user->carts()
                ->where('products.id', $productId)
                ->lockForUpdate()
                ->first();

            if (!$cartItem) {
                return null;
            }

            $currentQuantity = max(1, (int) $cartItem->pivot->quantity);

            if ($currentQuantity === 1) {
                $user->carts()->detach($productId);
            } else {
                $user->carts()->updateExistingPivot($productId, [
                    'quantity' => $currentQuantity - 1,
                ]);
            }

            // Una unidad deja de estar reservada y vuelve al inventario.
            $product->increment('stock', 1);

            return $currentQuantity - 1;
        });

        if ($remainingQuantity === null) {
            return response()->json(['message' => 'El producto no está en tu carrito'], 400);
        }

        return response()->json([
            'message' => 'Se eliminó una unidad del carrito y el stock fue restaurado',
            'remaining_quantity' => $remainingQuantity,
        ]);
    }

    public function destroy(Request $request, $productId){
        $user = $request->user();
        $product = Product::findOrFail($productId);
        
        $cartItem = $user->carts()->where('product_id', $productId)->first();

        if (!$cartItem) {
            return response()->json(['message' => 'El producto no está en tu carrito'], 400);
        }

        // Rescatamos cuántas unidades de este producto tenía el usuario
        $quantityToRestore = $cartItem->pivot->quantity;

        DB::transaction(function () use ($user, $product, $productId, $quantityToRestore) {
            // Lo quitamos del carrito
            $user->carts()->detach($productId);
            // Restauramos todo ese stock al producto principal
            $product->increment('stock', $quantityToRestore);
        });
        
        return response()->json(['message' => 'Producto eliminado del carrito y stock restaurado']);
    }
}
