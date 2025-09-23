import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

const WishlistContext = createContext(null);

export function WishlistProvider({ children }) {
  const [items, setItems] = useState(() => {
    try {
      const raw = localStorage.getItem("cc_wishlist");
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem("cc_wishlist", JSON.stringify(items));
  }, [items]);

  // Sync with server when logged in
  useEffect(() => {
    async function syncWishlist() {
      const token = localStorage.getItem("cc_token") || localStorage.getItem("token");
      if (!token) return;
      try {
        const base = window.location.origin.includes('localhost') ? (import.meta?.env?.VITE_API_BASE_URL || 'http://localhost:5000') : '';
        const res = await fetch(`${base}/api/auth/me/wishlist`, { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json();
        const serverItems = Array.isArray(data?.items) ? data.items : [];
        const map = new Map();
        for (const it of serverItems) map.set(it._id, { ...it });
        for (const it of items) map.set(it._id, { ...it, ...(map.get(it._id) || {}) });
        const merged = Array.from(map.values());
        setItems(merged);
        await fetch(`${base}/api/auth/me/wishlist`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ items: merged.map(i => ({ _id: i._id })) })
        });
      } catch {
        // ignore
      }
    }
    syncWishlist();
  }, []);

  const contains = (id) => items.some((p) => p._id === id);

  const value = useMemo(
    () => ({
      items,
      totalItems: items.length,
      add: (product) => {
        setItems((prev) => (prev.some((p) => p._id === product._id)
          ? prev
          : [...prev, { _id: product._id, name: product.name, price: product.price || 0, image: product.image }])
        );
      },
      remove: (id) => setItems((prev) => prev.filter((p) => p._id !== id)),
      toggle: (product) => {
        setItems((prev) =>
          prev.some((p) => p._id === product._id)
            ? prev.filter((p) => p._id !== product._id)
            : [...prev, { _id: product._id, name: product.name, price: product.price || 0, image: product.image }]
        );
      },
      contains,
      clear: () => setItems([]),
    }),
    [items]
  );

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist must be used within WishlistProvider");
  return ctx;
}
