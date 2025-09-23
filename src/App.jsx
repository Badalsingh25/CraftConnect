import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Hero from "./components/Hero";
import Login from "./pages/Login.jsx";
import Signup from "./pages/Signup.jsx";
import { useAuth } from "./state/AuthContext.jsx";
import DashboardHome from "./pages/DashboardHome.jsx";
import Products from "./pages/Products.jsx";
import Orders from "./pages/Orders.jsx";
import ArtisanProfile from "./pages/artisanprofile.jsx"; 
import Contact from "./pages/Contact.jsx";
import ChatbotWidget from "./components/ChatbotWidget"; 
import ArtisansPreview from "./pages/Artisans.jsx"; 
import Features from "./pages/Features.jsx";
import Impact from "./pages/Impact.jsx";
import PublicProducts from "./pages/PublicProducts.jsx";
import Sidebar from "./components/Sidebar.jsx";
import { CartProvider } from "./state/CartContext.jsx";
import Cart from "./pages/Cart.jsx";
import Wishlist from "./pages/Wishlist.jsx";
import { WishlistProvider } from "./state/WishlistContext.jsx";
import MyOrders from "./pages/MyOrders.jsx";
import ProductDetails from "./pages/ProductDetails.jsx";

function Home() {
  return (
    <main className="flex-grow">
      <Hero />
    </main>
  );
}

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <CartProvider>
      <WishlistProvider>
      <div className="flex flex-col min-h-screen">
        <Navbar />

        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/products" element={<PublicProducts />} /> 
          <Route path="/products/:id" element={<ProductDetails />} /> 
          <Route path="/contact" element={<Contact />} />
          <Route path="/features" element={<Features />} />
          <Route path="/impact" element={<Impact />} />
          <Route path="/checkout" element={<Cart />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/wishlist" element={<Wishlist />} />
          <Route path="/my-orders" element={<ProtectedRoute><MyOrders /></ProtectedRoute>} />
          <Route path="/artisans" element={<ArtisansPreview />} />

          {/* Protected Dashboard Routes */}
          <Route
            path="/dashboard/*"
            element={
              <ProtectedRoute>
                <div className="flex">
                  <Sidebar />
                  <div className="ml-64 flex-1 bg-gray-100 min-h-screen p-6">
                    <Routes>
                      <Route path="" element={<DashboardHome />} />
                      <Route path="products" element={<Products />} />
                      <Route path="orders" element={<Orders />} />
                      <Route path="profile" element={<ArtisanProfile />} />
                    </Routes>
                  </div>
                </div>
              </ProtectedRoute>
            }
          />
        </Routes>

        <Footer />
        <ChatbotWidget />
      </div>
      </WishlistProvider>
      </CartProvider>
    </BrowserRouter>
  );
}
