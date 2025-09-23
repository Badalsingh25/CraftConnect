import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try {
      const raw = localStorage.getItem("cc_cart");
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem("cc_cart", JSON.stringify(items));
  }, [items]);

  // Sync with server when logged in (merge once; then server is source of truth)
  const hasSyncedRef = useRef(false);
  useEffect(() => {
    async function syncCart() {
      const token = localStorage.getItem("cc_token") || localStorage.getItem("token");
      if (!token || hasSyncedRef.current) return; // not logged in or already synced
      hasSyncedRef.current = true;
      try {
        const base = window.location.origin.includes('localhost') ? (import.meta?.env?.VITE_API_BASE_URL || 'http://localhost:5000') : '';
        // fetch server cart
        const res = await fetch(`${base}/api/auth/me/cart`, { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json();
        const serverItems = Array.isArray(data?.items) ? data.items : [];

        // If we have pre-login local items and we've never merged this session, merge once
        const local = (() => {
          try { return JSON.parse(localStorage.getItem('cc_cart') || '[]'); } catch { return []; }
        })();
        const alreadyMerged = localStorage.getItem('cc_cart_merged') === '1';
        let finalList = serverItems;
        if (!alreadyMerged && local.length > 0) {
          const map = new Map();
          for (const it of serverItems) map.set(it._id, { ...it });
          for (const it of local) {
            const prev = map.get(it._id) || { _id: it._id, name: it.name, price: it.price || 0, image: it.image, quantity: 0 };
            const qty = Math.max(1, (prev.quantity || 0) + (it.quantity || 0));
            map.set(it._id, { ...prev, quantity: qty });
          }
          finalList = Array.from(map.values());
          // push merged back to server once
          await fetch(`${base}/api/auth/me/cart`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ items: finalList.map(i => ({ _id: i._id, quantity: i.quantity })) })
          });
          localStorage.setItem('cc_cart_merged', '1');
        }

        // Server is source of truth when logged in
        setItems(finalList);
        localStorage.setItem('cc_cart', JSON.stringify(finalList));
      } catch (e) {
        // ignore
      }
    }
    // Run once on mount; also listen to custom auth-changed event
    syncCart();
    const onAuthChanged = () => { hasSyncedRef.current = false; localStorage.removeItem('cc_cart_merged'); syncCart(); };
    window.addEventListener('auth-changed', onAuthChanged);
    return () => window.removeEventListener('auth-changed', onAuthChanged);
  }, []);

  // Listen for global add-to-cart events dispatched from product cards
  useEffect(() => {
    function onAddToCart(e) {
      const product = e?.detail;
      if (!product || !product._id) return;
      setItems((prev) => {
        const idx = prev.findIndex((p) => p._id === product._id);
        if (idx >= 0) {
          const copy = [...prev];
          copy[idx] = { ...copy[idx], quantity: copy[idx].quantity + 1 };
          return copy;
        }
        return [
          ...prev,
          { _id: product._id, name: product.name, price: product.price || 0, image: product.image, quantity: 1 },
        ];
      });
    }
    window.addEventListener('add-to-cart', onAddToCart);
    return () => window.removeEventListener('add-to-cart', onAddToCart);
  }, []);

  const totalItems = items.reduce((sum, it) => sum + it.quantity, 0);
  const subtotal = items.reduce((sum, it) => sum + (it.price || 0) * it.quantity, 0);

  const value = useMemo(() => ({
    items,
    totalItems,
    subtotal,
    addToCart: (product) => {
      setItems((prev) => {
        const idx = prev.findIndex((p) => p._id === product._id);
        if (idx >= 0) {
          const copy = [...prev];
          copy[idx] = { ...copy[idx], quantity: copy[idx].quantity + 1 };
          return copy;
        }
        return [...prev, { _id: product._id, name: product.name, price: product.price || 0, image: product.image, quantity: 1 }];
      });
    },
    removeFromCart: (id) => setItems((prev) => prev.filter((p) => p._id !== id)),
    updateQty: (id, qty) => setItems((prev) => prev.map((p) => p._id === id ? { ...p, quantity: Math.max(1, qty) } : p)),
    clearCart: () => setItems([]),
  }), [items, totalItems, subtotal]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}


