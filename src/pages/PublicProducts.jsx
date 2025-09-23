import React, { useState, useEffect } from "react";
import { useToast } from "../ui/ToastProvider.jsx";
import { API_BASE_URL } from "../config";
import { useCart } from "../state/CartContext.jsx";
import { useWishlist } from "../state/WishlistContext.jsx";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";

export default function PublicProducts() {

  const { show } = useToast();
  const { addToCart } = useCart();
  const { toggle, contains } = useWishlist();
  const navigate = useNavigate();
  const [shareOpenId, setShareOpenId] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  const categories = [
    { id: "all", name: "All Products", icon: "🌟" },
    { id: "pottery", name: "Pottery", icon: "🏺" },
    { id: "textiles", name: "Textiles", icon: "🧵" },
    { id: "woodwork", name: "Woodwork", icon: "🪵" },
    { id: "jewelry", name: "Jewelry", icon: "💎" },
    { id: "metalwork", name: "Metalwork", icon: "⚒️" },
    { id: "basketry", name: "Basketry", icon: "🧺" },
    { id: "other", name: "Other", icon: "✨" }
  ];

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  const [total, setTotal] = useState(0);

  async function fetchProducts() {
    try {
      setLoading(true);
      setError("");
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("pageSize", String(pageSize));
      params.set("sort", sortBy);
      if (selectedCategory && selectedCategory !== "all") params.set("category", selectedCategory);
      if (searchTerm) params.set("search", searchTerm);
      const res = await fetch(`${API_BASE_URL}/api/products?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load products");
      const data = await res.json();
      if (Array.isArray(data)) {
        setProducts(data || []);
        setTotal(data.length);
      } else {
        setProducts(data.items || []);
        setTotal(data.total || 0);
      }
    } catch (e) {
      setError(e.message || "Failed to load products");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchProducts();
  }, [page, pageSize, selectedCategory, sortBy]);

  useEffect(() => {
    const t = setTimeout(() => fetchProducts(), 300);
    return () => clearTimeout(t);
  }, [searchTerm]);

  const sortedProducts = products;

  function getImageUrl(img) {
    if (!img) return '';
    if (/^https?:\/\//i.test(img)) return img; // already absolute
    const path = img.startsWith('/') ? img : `/${img}`;
    return `${API_BASE_URL}${path}`;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-indigo-900 via-purple-900 to-pink-900">
        <div className="absolute inset-0 bg-black opacity-40"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
              Discover Handcrafted
              <span className="block bg-gradient-to-r from-pink-400 to-yellow-400 bg-clip-text text-transparent">
                Masterpieces
              </span>
            </h1>
            <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
              Explore unique handcrafted products from skilled artisans around the world. Each piece tells a story of tradition, culture, and exceptional craftsmanship.
            </p>
          </div>
        </div>
      </div>

      {/* Search and Filter Section */}
      <div className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row gap-6 items-center justify-between">
            {/* Search Bar */}
            <div className="relative flex-1 max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-full focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            {/* Category Filter */}
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                    selectedCategory === category.id
                      ? 'bg-indigo-600 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <span className="mr-2">{category.icon}</span>
                  {category.name}
                </button>
              ))}
            </div>

            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="name">Name A-Z</option>
            </select>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="text-center py-20">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
              <p className="mt-4 text-gray-600">Loading beautiful products...</p>
            </div>
          ) : error ? (
            <div className="text-center py-20">
              <div className="text-red-500 text-xl mb-4">⚠️</div>
              <p className="text-gray-600">{error}</p>
              <button
                onClick={fetchProducts}
                className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                Try Again
              </button>
            </div>
          ) : sortedProducts.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">No Products Found</h3>
              <p className="text-gray-600 mb-6">Try adjusting your search or filter criteria</p>
              <button
                onClick={() => {
                  setSearchTerm("");
                  setSelectedCategory("all");
                }}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <>
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900">
                  {total} Product{total !== 1 ? 's' : ''} Found
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {sortedProducts.map((product) => (
                  <div
                    key={product._id}
                    className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 overflow-hidden group"
                  >
                    {/* Product Image */}
                    <div className="relative h-64 overflow-hidden">
                      {product.image ? (
                        <Link to={`/products/${product._id}`}>
                          <img
                            src={getImageUrl(product.image)}
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                        </Link>
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                          <span className="text-4xl text-gray-400">🎨</span>
                        </div>
                      )}
                      <div className="absolute top-4 right-4">
                        <span className="px-3 py-1 bg-white bg-opacity-90 rounded-full text-xs font-medium text-gray-700">
                          Handcrafted
                        </span>
                      </div>
                    </div>

                    {/* Product Info */}
                    <div className="p-6">
                      <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-1">
                        <Link to={`/products/${product._id}`} className="hover:underline">
                          {product.name}
                        </Link>
                      </h3>
                      {typeof product.price === 'number' && (
                        <div className="text-lg font-semibold text-emerald-700 mb-2">
                          ₹{Number(product.price).toFixed(2)}
                        </div>
                      )}
                      
                      {product.description && (
                        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                          {product.description}
                        </p>
                      )}

                      {/* Artisan Info */}
                      {product.artisan && (
                        <div className="flex items-center mb-4">
                          <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                            {product.artisan.name?.charAt(0) || 'A'}
                          </div>
                          <div className="ml-3">
                            <p className="text-sm font-medium text-gray-900">
                              {product.artisan.name || 'Anonymous Artisan'}
                            </p>
                            <p className="text-xs text-gray-500">Artisan</p>
                          </div>
                        </div>
                      )}

                      {/* Story Preview */}
                      {product.story && (
                        <div className="mb-4 p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg">
                          <p className="text-xs text-gray-600 italic line-clamp-2">
                            "{product.story}"
                          </p>
                        </div>
                      )}

                      {/* Ratings and trust */}
                      <div className="flex items-center gap-2 mb-3">
                        <div className="text-yellow-500">★</div>
                        <span className="text-sm text-gray-700">{product.rating?.toFixed?.(1) || "4.5"} ({product.ratingCount || 12})</span>
                        <span className="ml-auto text-xs text-gray-500">Easy returns • Secure payments</span>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2 relative">
                        <button
                          onClick={() => {
                            addToCart(product);
                            show(`${product.name} added to cart`, 'success');
                            navigate('/cart');
                          }}
                          className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors duration-200 text-sm font-medium"
                        >
                          Add to Cart
                        </button>
                        <button
                          onClick={() => {
                            toggle(product);
                            const inWish = contains(product._id);
                            show(inWish ? 'Removed from wishlist' : 'Added to wishlist', inWish ? 'info' : 'success');
                          }}
                          className={`px-4 py-2 border rounded-lg transition-colors duration-200 text-sm font-medium ${contains(product._id) ? 'border-pink-600 text-pink-600 bg-pink-50 hover:bg-pink-100' : 'border-indigo-600 text-indigo-600 hover:bg-indigo-50'}`}
                          aria-label="Toggle wishlist"
                          title={contains(product._id) ? 'Remove from wishlist' : 'Add to wishlist'}
                        >
                          {contains(product._id) ? '❤' : '♡'}
                        </button>
                        <button
                          onClick={() => setShareOpenId(shareOpenId === product._id ? null : product._id)}
                          className="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200 text-sm"
                          aria-label="Open share menu"
                        >
                          Share
                        </button>

                        {shareOpenId === product._id && (
                          <div className="absolute right-0 bottom-full mb-2 bg-white border border-gray-200 rounded-lg shadow-lg p-2 flex gap-2 z-10">
                            <button
                              onClick={() => {
                                const url = new URL(window.location.origin + `/products/${product._id}`);
                                url.searchParams.set('utm_source', 'share');
                                url.searchParams.set('utm_medium', 'button');
                                url.searchParams.set('utm_campaign', 'product_share');
                                const shareUrl = url.toString();
                                const text = `${product.name} — ${product.description?.slice(0, 80) || 'Discover this handcrafted item'} ${shareUrl}`;
                                const twitter = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
                                window.open(twitter, '_blank');
                              }}
                              className="w-9 h-9 rounded-full border border-gray-200 hover:bg-gray-50 flex items-center justify-center"
                              title="Share on X"
                              aria-label="Share on X"
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-gray-700"><path d="M18.244 2h3.314l-7.243 8.272L23 22h-6.828l-4.72-6.165L5.83 22H2.515l7.74-8.847L1 2h6.98l4.27 5.727L18.244 2zm-1.197 18h1.834L7.046 4h-1.9l11.901 16z"/></svg>
                            </button>
                            <button
                              onClick={() => {
                                const url = new URL(window.location.origin + `/products/${product._id}`);
                                url.searchParams.set('utm_source', 'share');
                                url.searchParams.set('utm_medium', 'button');
                                url.searchParams.set('utm_campaign', 'product_share');
                                const shareUrl = url.toString();
                                const text = `${product.name} — ${product.description?.slice(0, 80) || 'Check this out'} ${shareUrl}`;
                                const wa = `https://wa.me/?text=${encodeURIComponent(text)}`;
                                window.open(wa, '_blank');
                              }}
                              className="w-9 h-9 rounded-full border border-gray-200 hover:bg-gray-50 flex items-center justify-center"
                              title="Share on WhatsApp"
                              aria-label="Share on WhatsApp"
                            >
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="text-green-600"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.471-.149-.671.149-.198.297-.769.967-.943 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.149-.174.198-.298.298-.497.099-.198.05-.372-.025-.521-.074-.149-.671-1.611-.919-2.206-.242-.579-.487-.5-.671-.51l-.571-.01c-.198 0-.521.074-.794.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.262.489 1.694.625.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/></svg>
                            </button>
                            <button
                              onClick={() => {
                                const url = new URL(window.location.origin + `/products/${product._id}`);
                                url.searchParams.set('utm_source', 'share');
                                url.searchParams.set('utm_medium', 'button');
                                url.searchParams.set('utm_campaign', 'product_share');
                                const shareUrl = url.toString();
                                navigator.clipboard.writeText(shareUrl).then(() => show('Link copied for Instagram', 'success'));
                              }}
                              className="w-9 h-9 rounded-full border border-gray-200 hover:bg-gray-50 flex items-center justify-center"
                              title="Copy for Instagram"
                              aria-label="Copy for Instagram"
                            >
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="text-pink-600"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 1.366.062 2.633.35 3.608 1.325.975.975 1.262 2.242 1.324 3.608.058 1.266.07 1.646.07 4.85s-.012 3.584-.07 4.85c-.062 1.366-.35 2.633-1.324 3.608-.975.975-2.242 1.262-3.608 1.324-1.266.058-1.646.07-4.85.07s-3.584-.012-4.85-.07c-1.366-.062-2.633-.35-3.608-1.324-.975-.975-1.262-2.242-1.324-3.608C2.175 15.747 2.163 15.367 2.163 12s.012-3.584.07-4.85c.062-1.366.35-2.633 1.324-3.608.975-.975 2.242-1.262 3.608-1.324C8.416 2.175 8.796 2.163 12 2.163zm0 1.837c-3.17 0-3.548.012-4.795.069-1.027.047-1.586.216-1.956.363-.492.191-.843.418-1.213.787-.37.37-.597.721-.787 1.213-.147.37-.316.929-.363 1.956-.057 1.247-.069 1.625-.069 4.795s.012 3.548.069 4.795c.047 1.027.216 1.586.363 1.956.191.492.418.843.787 1.213.37.37.721.597 1.213.787.37.147.929.316 1.956.363 1.247.057 1.625.069 4.795.069s3.548-.012 4.795-.069c1.027-.047 1.586-.216 1.956-.363.492-.191.843-.418 1.213-.787.37-.37.597-.721.787-1.213.147-.37.316-.929.363-1.956.057-1.247.069-1.625.069-4.795s-.012-3.548-.069-4.795c-.047-1.027-.216-1.586-.363-1.956-.191-.492-.418-.843-1.213-.787-.37-.147-.929-.316-1.956-.363-1.247-.057-1.625-.069-4.795-.069zm0 3.838a5.162 5.162 0 110 10.324 5.162 5.162 0 010-10.324zm0 1.837a3.325 3.325 0 100 6.65 3.325 3.325 0 000-6.65zm5.406-3.845a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z"/></svg>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination Controls */}
              <div className="mt-10 flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Page {page} of {Math.max(1, Math.ceil(total / pageSize))}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                    className="px-4 py-2 border rounded-lg disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPage(page + 1)}
                    disabled={page >= Math.ceil(total / pageSize)}
                    className="px-4 py-2 border rounded-lg disabled:opacity-50"
                  >
                    Next
                  </button>
                  <select
                    value={pageSize}
                    onChange={(e) => { setPage(1); setPageSize(Number(e.target.value)); }}
                    className="ml-2 px-2 py-2 border rounded-lg"
                  >
                    <option value={9}>9</option>
                    <option value={12}>12</option>
                    <option value={24}>24</option>
                  </select>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-20 bg-gradient-to-r from-indigo-600 to-purple-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Are You an Artisan?
          </h2>
          <p className="text-xl text-indigo-100 mb-8">
            Join our community and showcase your handcrafted products to customers worldwide.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="/signup" className="px-8 py-4 bg-white text-indigo-600 rounded-full font-semibold hover:bg-gray-100 transition-colors duration-300">
              Start Selling Today
            </a>
            <a href="/features" className="px-8 py-4 border-2 border-white text-white rounded-full font-semibold hover:bg-white hover:text-indigo-600 transition-all duration-300">
              Learn More
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}