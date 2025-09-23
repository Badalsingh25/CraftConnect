import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../config";
import { useCart } from "../state/CartContext.jsx";
import { useWishlist } from "../state/WishlistContext.jsx";
import { useToast } from "../ui/ToastProvider.jsx";
import { useAuth } from "../state/AuthContext.jsx";

export default function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { toggle, contains } = useWishlist();
  const { show } = useToast();
  const { isAuthenticated } = useAuth();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reviews, setReviews] = useState([]);
  const [reviewText, setReviewText] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [submitting, setSubmitting] = useState(false);

  function getImageUrl(img) {
    if (!img) return '';
    if (/^https?:\/\//i.test(img)) return img;
    const path = img.startsWith('/') ? img : `/${img}`;
    return `${API_BASE_URL}${path}`;
  }

  async function fetchProduct() {
    try {
      setLoading(true);
      setError("");
      const res = await fetch(`${API_BASE_URL}/api/products/${id}`);
      if (!res.ok) throw new Error("Failed to load product");
      const data = await res.json();
      setProduct(data);
    } catch (e) {
      setError(e.message || "Failed to load product");
    } finally {
      setLoading(false);
    }
  }

  async function fetchReviews() {
    try {
      const res = await fetch(`${API_BASE_URL}/api/products/${id}/reviews`);
      if (!res.ok) return; // optional endpoint
      const data = await res.json();
      setReviews(Array.isArray(data) ? data : (data.items || []));
    } catch {
      // ignore if backend not ready
    }
  }

  useEffect(() => {
    fetchProduct();
    fetchReviews();
  }, [id]);

  async function submitReview(e) {
    e.preventDefault();
    if (!isAuthenticated) {
      show('Please login to submit a review', 'info');
      navigate('/login');
      return;
    }
    try {
      setSubmitting(true);
      const token = localStorage.getItem("cc_token") || localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/api/products/${id}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ rating: reviewRating, text: reviewText })
      });
      if (!res.ok) throw new Error('Failed to submit review');
      setReviewText("");
      setReviewRating(5);
      show('Thanks for your review!', 'success');
      fetchReviews();
    } catch (e) {
      show(e.message || 'Failed to submit review', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-white p-8 rounded-xl shadow text-center">
          <p className="text-gray-700 mb-4">{error || 'Product not found'}</p>
          <Link to="/products" className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Back to Products</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            {product.image ? (
              <img src={getImageUrl(product.image)} alt={product.name} className="w-full h-auto rounded-2xl shadow" />
            ) : (
              <div className="w-full h-80 bg-gray-200 rounded-2xl" />
            )}
          </div>
          <div>
            <h1 className="text-3xl font-bold mb-2">{product.name}</h1>
            {typeof product.price === 'number' && (
              <div className="text-2xl font-semibold text-emerald-700 mb-4">₹{Number(product.price).toFixed(2)}</div>
            )}
            {product.artisan && (
              <div className="mb-4 text-sm text-gray-600">By <span className="font-medium text-gray-900">{product.artisan.name || 'Artisan'}</span></div>
            )}
            {product.description && (
              <p className="text-gray-700 mb-6">{product.description}</p>
            )}
            {product.story && (
              <div className="mb-6 p-4 bg-purple-50 rounded-lg text-sm text-gray-700 italic">"{product.story}"</div>
            )}

            <div className="flex gap-3 mb-8">
              <button
                onClick={() => {
                  addToCart(product);
                  show(`${product.name} added to cart`, 'success');
                  navigate('/cart');
                }}
                className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                Add to Cart
              </button>
              <button
                onClick={() => {
                  toggle(product);
                  const inWish = contains(product._id);
                  show(inWish ? 'Removed from wishlist' : 'Added to wishlist', inWish ? 'info' : 'success');
                }}
                className={`px-6 py-3 border rounded-lg ${contains(product._id) ? 'border-pink-600 text-pink-600 bg-pink-50 hover:bg-pink-100' : 'border-indigo-600 text-indigo-600 hover:bg-indigo-50'}`}
              >
                {contains(product._id) ? '❤ In Wishlist' : '♡ Add to Wishlist'}
              </button>
            </div>

            <div className="text-sm text-gray-500">Easy returns • Secure payments • Buyer protection</div>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2">
            <h2 className="text-xl font-semibold mb-4">Customer Reviews</h2>
            {reviews.length === 0 ? (
              <div className="bg-white p-6 rounded-xl shadow text-gray-600">No reviews yet.</div>
            ) : (
              <div className="space-y-4">
                {reviews.map((r, idx) => (
                  <div key={idx} className="bg-white p-4 rounded-xl shadow">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="text-yellow-500">{'★'.repeat(r.rating || 5)}</div>
                      <span className="text-sm text-gray-500">{new Date(r.createdAt || Date.now()).toLocaleDateString()}</span>
                    </div>
                    <p className="text-gray-800 text-sm">{r.text || ''}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div>
            <h2 className="text-xl font-semibold mb-4">Write a Review</h2>
            <form onSubmit={submitReview} className="bg-white p-6 rounded-xl shadow space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rating</label>
                <select value={reviewRating} onChange={(e) => setReviewRating(Number(e.target.value))} className="w-full border rounded-lg px-3 py-2">
                  {[5,4,3,2,1].map(v => <option key={v} value={v}>{v} Star{v>1?'s':''}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Your review</label>
                <textarea value={reviewText} onChange={(e) => setReviewText(e.target.value)} rows={4} className="w-full border rounded-lg px-3 py-2" placeholder="Share your experience..." />
              </div>
              <button disabled={submitting} className="w-full px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-60">
                {submitting ? 'Submitting...' : 'Submit Review'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
