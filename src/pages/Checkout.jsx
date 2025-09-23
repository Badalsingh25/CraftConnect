import React from "react";
import { useCart } from "../state/CartContext.jsx";
import { API_BASE_URL } from "../config";
import { useAuth } from "../state/AuthContext.jsx";

export default function Checkout() {
  const { items, subtotal, updateQty, removeFromCart, clearCart } = useCart();
  const { user } = useAuth();

  async function placeOrder() {
    if (items.length === 0) return;
    try {
      const token = localStorage.getItem("cc_token") || localStorage.getItem("token");
      if (!token) {
        alert("Please login to place an order.");
        return;
      }
      const res = await fetch(`${API_BASE_URL}/api/orders/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          customerName: user?.name || 'Customer',
          items: items.map(i => ({ _id: i._id, quantity: i.quantity })),
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to place order');
      clearCart();
      alert('Order placed successfully!');
      window.location.href = '/dashboard/orders';
    } catch (e) {
      alert(e.message || 'Failed to place order');
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold mb-6">Checkout</h1>
        {items.length === 0 ? (
          <div className="bg-white p-8 rounded-xl shadow text-center">
            <p className="text-gray-600">Your cart is empty.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-4">
              {items.map((it) => (
                <div key={it._id} className="bg-white p-4 rounded-xl shadow flex gap-4 items-center">
                  <img src={it.image} alt={it.name} className="w-20 h-20 object-cover rounded" />
                  <div className="flex-1">
                    <p className="font-medium">{it.name}</p>
                    <p className="text-sm text-gray-500">₹{(it.price || 0).toFixed(2)}</p>
                  </div>
                  <input
                    type="number"
                    min={1}
                    value={it.quantity}
                    onChange={(e) => updateQty(it._id, Number(e.target.value))}
                    className="w-16 border rounded px-2 py-1"
                  />
                  <button onClick={() => removeFromCart(it._id)} className="text-red-600">Remove</button>
                </div>
              ))}
            </div>
            <div className="bg-white p-6 rounded-xl shadow">
              <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
              <div className="flex justify-between mb-2">
                <span>Subtotal</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between mb-4 text-sm text-gray-500">
                <span>Shipping</span>
                <span>Calculated at next step</span>
              </div>
              <button
                onClick={placeOrder}
                className="w-full px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                Place Order
              </button>
              <p className="mt-3 text-xs text-gray-500">Secure payments • Easy returns • Buyer protection</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


