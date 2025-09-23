import React, { useState } from "react";
import { Menu, X } from "lucide-react"; // for mobile icons
import { Link } from "react-router-dom";
import { useAuth } from "../state/AuthContext.jsx";
import logo from "../assets/logo.jpg"; // Your logo
import { useCart } from "../state/CartContext.jsx";
import { useWishlist } from "../state/WishlistContext.jsx";
import MiniCart from "./MiniCart.jsx";


export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [miniOpen, setMiniOpen] = useState(false);
  const { isAuthenticated, logout } = useAuth();
  const { totalItems: cartCount } = useCart();
  const { totalItems: wishCount } = useWishlist();

  return (
    <nav className="bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/70 sticky top-0 z-50 border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-6 py-3 md:py-4 flex justify-between items-center">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 cursor-pointer select-none">
          <img
            src={logo}
            alt="CraftConnect Logo"
            className="h-10 w-10 rounded-lg object-cover shadow-sm"
          />
          <div className="leading-tight">
            <p className="text-xl md:text-2xl font-extrabold text-gray-900">CraftConnect</p>
            <p className="text-[11px] tracking-wide text-gray-500 hidden sm:block">
              Artisans • Stories • Marketplace
            </p>
          </div>
        </Link>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-8 text-gray-700 font-medium">
          {!isAuthenticated && (
            <>
              <Link to="/" className="hover:text-gray-900 transition-colors">Home</Link>
              <Link to="/features" className="hover:text-gray-900 transition-colors">Features</Link>
            </>
          )}
          <Link to="/products" className="hover:text-gray-900 transition-colors">Products</Link>
          <Link to="/dashboard" className="hover:text-gray-900 transition-colors">Dashboard</Link>
          {isAuthenticated && (
            <Link to="/my-orders" className="hover:text-gray-900 transition-colors">My Orders</Link>
          )}
          <Link to="/contact" className="hover:text-gray-900 transition-colors">Contact</Link>
          <Link to="/impact" className="hover:text-gray-900 transition-colors">Our Impact</Link>
          <Link to="/wishlist" className="relative hover:text-gray-900 transition-colors">
            Wishlist
            {wishCount > 0 && (
              <span className="absolute -top-2 -right-3 text-xs bg-pink-600 text-white rounded-full px-1.5 py-0.5">
                {wishCount}
              </span>
            )}
          </Link>
          <button
            onClick={() => setMiniOpen(true)}
            className="relative hover:text-gray-900 transition-colors"
          >
            Cart
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-3 text-xs bg-indigo-600 text-white rounded-full px-1.5 py-0.5">
                {cartCount}
              </span>
            )}
          </button>
        </div>

        {/* Auth Buttons (Desktop) */}
        <div className="hidden md:flex items-center gap-3">
          {isAuthenticated ? (
            <>
              <Link
                to="/dashboard"
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:border-gray-400 hover:bg-gray-50 transition-colors"
              >
                My Dashboard
              </Link>
              <button
                onClick={logout}
                className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-black transition-colors"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:border-gray-400 hover:bg-gray-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              >
                Login
              </Link>
              <Link
                to="/signup"
                className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg shadow hover:from-indigo-700 hover:to-purple-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              >
                Signup
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu Toggle */}
        <div className="md:hidden">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="text-gray-700 p-2 rounded-lg hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          >
            {isOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 shadow-sm px-6 py-4 space-y-4">
          {!isAuthenticated && (
            <>
              <Link to="/" className="block text-gray-700 hover:text-indigo-600">Home</Link>
              <Link to="/features" className="block text-gray-700 hover:text-indigo-600">Features</Link>
            </>
          )}
          <Link to="/products" className="block text-gray-700 hover:text-indigo-600">Products</Link>
          <Link to="/dashboard" className="block text-gray-700 hover:text-indigo-600">Dashboard</Link>
          {isAuthenticated && (
            <Link to="/my-orders" className="block text-gray-700 hover:text-indigo-600">My Orders</Link>
          )}
          <Link to="/contact" className="block text-gray-700 hover:text-indigo-600">Contact</Link>
          <Link to="/wishlist" className="block text-gray-700 hover:text-indigo-600">Wishlist {wishCount > 0 ? `(${wishCount})` : ''}</Link>
          <button onClick={() => setMiniOpen(true)} className="block text-left w-full text-gray-700 hover:text-indigo-600">Cart {cartCount > 0 ? `(${cartCount})` : ''}</button>

          <div className="flex space-x-4 pt-4">
            {isAuthenticated ? (
              <button
                onClick={() => {
                  setIsOpen(false);
                  logout();
                }}
                className="flex-1 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-black transition-colors"
              >
                Logout
              </button>
            ) : (
              <>
                <Link
                  to="/login"
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-colors"
                >
                  Signup
                </Link>
              </>
            )}
          </div>
        </div>
      )}
      <MiniCart open={miniOpen} onClose={() => setMiniOpen(false)} />
    </nav>
  );
}
