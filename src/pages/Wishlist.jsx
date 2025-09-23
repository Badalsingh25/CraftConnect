import React from "react";
import { useWishlist } from "../state/WishlistContext.jsx";
import { useCart } from "../state/CartContext.jsx";

export default function Wishlist() {
  const { items, remove, clear } = useWishlist();
  const { addToCart } = useCart();

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold mb-6">Your Wishlist</h1>
        {items.length === 0 ? (
          <div className="bg-white p-8 rounded-xl shadow text-center">
            <p className="text-gray-600">Your wishlist is empty.</p>
            <a href="/products" className="inline-block mt-4 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Browse Products</a>
          </div>
        ) : (
          <div className="space-y-4">
            {items.map((it) => (
              <div key={it._id} className="bg-white p-4 rounded-xl shadow flex gap-4 items-center">
                <img src={it.image} alt={it.name} className="w-20 h-20 object-cover rounded" />
                <div className="flex-1">
                  <p className="font-medium">{it.name}</p>
                  {typeof it.price === 'number' && (
                    <p className="text-sm text-gray-500">₹{(it.price || 0).toFixed(2)}</p>
                  )}
                </div>
                <button
                  onClick={() => addToCart({ _id: it._id, name: it.name, price: it.price, image: it.image })}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  Add to Cart
                </button>
                <button
                  onClick={() => remove(it._id)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Remove
                </button>
              </div>
            ))}
            <div className="bg-white p-4 rounded-xl shadow flex justify-between items-center">
              <p className="text-gray-600">{items.length} item(s) in wishlist</p>
              <button onClick={clear} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                Clear Wishlist
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
