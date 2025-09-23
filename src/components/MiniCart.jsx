import React from "react";
import { useCart } from "../state/CartContext.jsx";

export default function MiniCart({ open, onClose }) {
  const { items, subtotal, updateQty, removeFromCart } = useCart();

  return (
    <div className={`fixed inset-0 z-50 ${open ? '' : 'pointer-events-none'}`} aria-hidden={!open}>
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/40 transition-opacity ${open ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
      />
      {/* Panel */}
      <div
        className={`absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-xl transition-transform duration-300 ${open ? 'translate-x-0' : 'translate-x-full'}`}
        role="dialog"
        aria-label="Mini Cart"
      >
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Your Cart ({items.length})</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700" aria-label="Close mini cart">✕</button>
        </div>
        <div className="p-4 space-y-3 overflow-y-auto h-[calc(100%-180px)]">
          {items.length === 0 ? (
            <p className="text-gray-600">Your cart is empty.</p>
          ) : (
            items.map(it => (
              <div key={it._id} className="flex items-center gap-3 border rounded-lg p-2">
                <img src={it.image} alt={it.name} className="w-14 h-14 object-cover rounded" />
                <div className="flex-1">
                  <p className="text-sm font-medium line-clamp-1">{it.name}</p>
                  <p className="text-xs text-gray-500">₹{(it.price || 0).toFixed(2)}</p>
                </div>
                <input
                  type="number"
                  min={1}
                  value={it.quantity}
                  onChange={(e) => updateQty(it._id, Number(e.target.value))}
                  className="w-16 border rounded px-2 py-1 text-sm"
                />
                <button onClick={() => removeFromCart(it._id)} className="text-red-600 text-sm">Remove</button>
              </div>
            ))
          )}
        </div>
        <div className="p-4 border-t">
          <div className="flex justify-between mb-3">
            <span className="text-sm text-gray-600">Subtotal</span>
            <span className="font-semibold">₹{subtotal.toFixed(2)}</span>
          </div>
          <a href="/cart" className="block w-full text-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Go to Cart</a>
        </div>
      </div>
    </div>
  );
}
