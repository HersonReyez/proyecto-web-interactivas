<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class OrderController extends Controller
{
    /**
     * Checkout: Simula la compra de todos los productos en el carrito del usuario.
     */
    public function checkout(Request $request)
    {
        $user = $request->user();

        // Obtener los productos que están en el carrito del usuario con su pivot de cantidad
        $cartItems = $user->carts()->get();

        if ($cartItems->isEmpty()) {
            return response()->json(['message' => 'Tu carrito está vacío. Agrega productos antes de comprar.'], 400);
        }

        $order = DB::transaction(function () use ($user, $cartItems, $request) {
            $totalAmount = 0;
            $totalUnits = 0;

            // Generar número de orden único: ORD-AAAAMMDD-XXXX
            $orderNumber = 'ORD-' . date('Ymd') . '-' . strtoupper(Str::random(4));

            $order = Order::create([
                'user_id' => $user->id,
                'order_number' => $orderNumber,
                'total' => 0, // se actualiza abajo
                'total_items' => 0,
                'status' => 'completada',
                'payment_method' => $request->input('payment_method', 'tarjeta_simulada'),
                'notes' => $request->input('notes', 'Compra simulada en línea'),
            ]);

            foreach ($cartItems as $item) {
                $quantity = (int) ($item->pivot->quantity ?? 1);
                $price = (float) $item->price;
                $subtotal = $price * $quantity;

                $totalAmount += $subtotal;
                $totalUnits += $quantity;

                // Crear el ítem de la orden persistiendo datos congelados al momento de compra
                OrderItem::create([
                    'order_id' => $order->id,
                    'product_id' => $item->id,
                    'product_name' => $item->name,
                    'price' => $price,
                    'quantity' => $quantity,
                    'subtotal' => $subtotal,
                    'anime_title' => $item->anime_title,
                    'image_path' => $item->image_path,
                ]);
            }

            $order->update([
                'total' => $totalAmount,
                'total_items' => $totalUnits,
            ]);

            // Vaciar el carrito del usuario (los items ya redujeron su stock al momento de añadirse al carrito)
            $user->carts()->detach();

            return $order;
        });

        return response()->json([
            'message' => '¡Compra realizada con éxito!',
            'order' => $order->load('items'),
        ], 201);
    }

    /**
     * Historial de compras del usuario autenticado (Cliente).
     */
    public function userOrders(Request $request)
    {
        $user = $request->user();

        $orders = Order::with('items')
            ->where('user_id', $user->id)
            ->latest()
            ->paginate(10);

        return response()->json($orders);
    }

    /**
     * Dashboard y Trazabilidad Global de todas las compras (Solo Administrador).
     */
    public function adminOrders(Request $request)
    {
        $query = Order::with(['user:id,name,email,role', 'items']);

        // Filtro por término de búsqueda (número de orden, nombre de usuario o email)
        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('order_number', 'like', "%{$search}%")
                  ->orWhereHas('user', function ($uq) use ($search) {
                      $uq->where('name', 'like', "%{$search}%")
                         ->orWhere('email', 'like', "%{$search}%");
                  });
            });
        }

        // Filtro por estado
        if ($status = $request->input('status')) {
            $query->where('status', $status);
        }

        // Filtro por fecha específica
        if ($date = $request->input('date')) {
            $query->whereDate('created_at', $date);
        }

        $orders = $query->latest()->paginate(15);

        // Métricas rápidas para el dashboard
        $stats = [
            'total_sales' => Order::where('status', 'completada')->sum('total'),
            'total_orders' => Order::count(),
            'total_units_sold' => OrderItem::sum('quantity'),
            'unique_customers' => Order::distinct('user_id')->count('user_id'),
        ];

        return response()->json([
            'orders' => $orders,
            'stats' => $stats,
        ]);
    }

    /**
     * Detalle específico de una orden (permite al admin o al dueño ver la orden).
     */
    public function show(Request $request, $id)
    {
        $user = $request->user();
        $order = Order::with(['user:id,name,email', 'items'])->findOrFail($id);

        if ($user->role !== 'admin' && $order->user_id !== $user->id) {
            return response()->json(['message' => 'No tienes permiso para ver esta orden.'], 403);
        }

        return response()->json($order);
    }
}

