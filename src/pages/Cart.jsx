import React, { useEffect, useState } from "react";
import { useCart } from "../state/CartContext.jsx";
import { API_BASE_URL } from "../config";
import { useAuth } from "../state/AuthContext.jsx";

export default function Cart() {
  const { items, subtotal, updateQty, removeFromCart, clearCart } = useCart();
  const { user } = useAuth();
  const [couponCode, setCouponCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [couponMsg, setCouponMsg] = useState("");
  const [applying, setApplying] = useState(false);
  const [payEnabled, setPayEnabled] = useState(false);
  const [razorpayKey, setRazorpayKey] = useState("");

  async function placeOrder(paymentId) {
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
          paymentId: paymentId || undefined,
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

  async function applyCoupon(e) {
    e.preventDefault();
    if (!couponCode.trim()) return;
    try {
      setApplying(true);
      setCouponMsg("");
      const token = localStorage.getItem("cc_token") || localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/api/coupons/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: token ? `Bearer ${token}` : undefined },
        body: JSON.stringify({ code: couponCode, subtotal })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Invalid coupon');
      let newDiscount = 0;
      if (data.type === 'percent') newDiscount = (subtotal * Number(data.amount || 0)) / 100;
      if (data.type === 'flat') newDiscount = Number(data.amount || 0);
      setDiscount(Math.min(newDiscount, subtotal));
      setCouponMsg(`Applied ${data.type === 'percent' ? data.amount + '%': '₹' + data.amount} off`);
    } catch (err) {
      setDiscount(0);
      setCouponMsg(err.message || 'Failed to validate coupon');
    } finally {
      setApplying(false);
    }
  }

  const total = Math.max(0, subtotal - discount);

  useEffect(() => {
    async function loadConfig() {
      try {
        const res = await fetch(`${API_BASE_URL}/api/payments/config`);
        const data = await res.json();
        setPayEnabled(Boolean(data?.enabled));
        setRazorpayKey(data?.keyId || "");
      } catch {
        setPayEnabled(false);
      }
    }
    loadConfig();
  }, []);

  async function payNow() {
    if (!payEnabled) {
      // fallback
      return placeOrder();
    }
    try {
      const token = localStorage.getItem("cc_token") || localStorage.getItem("token");
      if (!token) {
        alert("Please login to place an order.");
        return;
      }
      // create backend payment order
      const res = await fetch(`${API_BASE_URL}/api/payments/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ amount: total })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to start payment');

      const options = {
        key: data.keyId || razorpayKey,
        amount: data.order.amount,
        currency: data.order.currency,
        name: 'CraftConnect',
        description: 'Order Payment',
        order_id: data.order.id,
        prefill: {
          name: user?.name || 'Customer',
          email: user?.email || '',
        },
        handler: async function (response) {
          try {
            const verifyRes = await fetch(`${API_BASE_URL}/api/payments/verify`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              })
            });
            const verifyData = await verifyRes.json();
            if (!verifyRes.ok || !verifyData.valid) throw new Error(verifyData.message || 'Payment verification failed');
            await placeOrder(response.razorpay_payment_id);
          } catch (err) {
            alert(err.message || 'Payment verification failed');
          }
        },
        theme: { color: '#4f46e5' },
      };

      const rz = new window.Razorpay(options);
      rz.open();
    } catch (e) {
      alert(e.message || 'Payment failed');
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold mb-6">Your Cart</h1>
        {items.length === 0 ? (
          <div className="bg-white p-8 rounded-xl shadow text-center">
            <p className="text-gray-600">Your cart is empty.</p>
            <a href="/products" className="inline-block mt-4 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Browse Products</a>
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
              <form onSubmit={applyCoupon} className="mb-4 flex gap-2">
                <input
                  type="text"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  placeholder="Coupon code"
                  className="flex-1 px-3 py-2 border rounded-lg"
                />
                <button
                  disabled={applying}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-60"
                >
                  {applying ? 'Applying...' : 'Apply'}
                </button>
              </form>
              {couponMsg && <p className="text-xs text-gray-600 mb-2">{couponMsg}</p>}
              <div className="flex justify-between mb-2">
                <span>Subtotal</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between mb-2 text-emerald-700">
                  <span>Discount</span>
                  <span>- ₹{discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between mb-2 text-sm text-gray-500">
                <span>Shipping</span>
                <span>Calculated at next step</span>
              </div>
              <div className="flex justify-between mb-4 text-sm text-gray-500">
                <span>Taxes</span>
                <span>Included where applicable</span>
              </div>
              <div className="flex justify-between mb-4 text-lg font-semibold">
                <span>Total</span>
                <span>₹{total.toFixed(2)}</span>
              </div>
              <button
                onClick={payNow}
                className="w-full px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                {payEnabled ? 'Pay Securely' : 'Place Order'}
              </button>
              <button
                onClick={clearCart}
                className="w-full mt-3 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Clear Cart
              </button>
              <p className="mt-3 text-xs text-gray-500">Secure payments • Easy returns • Buyer protection</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
