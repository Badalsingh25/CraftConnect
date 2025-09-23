import { useEffect, useState } from "react";
import { API_BASE_URL } from "../config";
import OrderDetailsModal from "../components/OrderDetailsModal.jsx";

export default function MyOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [sortBy, setSortBy] = useState('placed_desc');
  const [selected, setSelected] = useState(null);

  async function fetchOrders() {
    try {
      setLoading(true);
      setError("");
      const token = localStorage.getItem("cc_token") || localStorage.getItem("token");
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("pageSize", String(pageSize));
      params.set("status", statusFilter);
      params.set("sort", sortBy);
      const res = await fetch(`${API_BASE_URL}/api/orders/customer?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to load orders");
      const data = await res.json();
      if (Array.isArray(data)) {
        setOrders(data);
        setTotal(data.length);
      } else {
        setOrders(data.items || []);
        setTotal(data.total || 0);
      }
    } catch (e) {
      setError(e.message || "Failed to load orders");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchOrders();
  }, [page, pageSize, statusFilter, sortBy]);

  async function updateStatus(id, status) {
    try {
      const token = localStorage.getItem("cc_token") || localStorage.getItem("token");
      const url = `${API_BASE_URL}/api/orders/${id}/status`;
      const res = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || `Failed to update status (${res.status})`);
      await fetchOrders();
    } catch (e) {
      alert(e.message || 'Failed to update status');
    }
  }

  function getImageUrl(img) {
    if (!img) return "";
    if (/^https?:\/\//i.test(img)) return img;
    const path = img.startsWith("/") ? img : `/${img}`;
    return `${API_BASE_URL}${path}`;
  }

  const currentPage = page;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold mb-6">My Orders</h1>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded border border-red-200">{error}</div>
        )}

        {/* Filters */}
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <label className="text-sm text-gray-600">Status</label>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 border rounded-lg"
          >
            <option value="all">All</option>
            <option value="Pending">Pending</option>
            <option value="Shipped">Shipped</option>
            <option value="Delivered">Delivered</option>
            <option value="Cancelled">Cancelled</option>
          </select>
          <label className="text-sm text-gray-600">Sort</label>
          <select value={sortBy} onChange={(e)=>{ setSortBy(e.target.value); setPage(1); }} className="px-3 py-2 border rounded-lg">
            <option value="placed_desc">Newest First</option>
            <option value="placed_asc">Oldest First</option>
            <option value="amount_desc">Amount High→Low</option>
            <option value="amount_asc">Amount Low→High</option>
            <option value="status_asc">Status A→Z</option>
            <option value="status_desc">Status Z→A</option>
          </select>
          <div className="ml-auto text-sm text-gray-600">{total} orders</div>
        </div>

        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-3">Order ID</th>
                <th className="p-3">Product</th>
                <th className="p-3">Status</th>
                <th className="p-3">Amount</th>
                <th className="p-3">Placed</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td className="p-4" colSpan={5}>
                    Loading...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td className="p-4" colSpan={6}>
                    No orders yet.
                  </td>
                </tr>
              ) : (
                orders.map((o) => (
                  <tr key={o._id} className="border-b hover:bg-gray-50">
                    <td className="p-3">{o._id.slice(-6).toUpperCase()}</td>
                    <td className="p-3 flex items-center gap-3">
                      {o.product?.image && (
                        <img
                          src={getImageUrl(o.product.image)}
                          alt={o.product?.name}
                          className="w-10 h-10 object-cover rounded"
                        />
                      )}
                      <span>{o.product?.name || "Product"}</span>
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          o.status === "Shipped"
                            ? "bg-green-100 text-green-600"
                            : o.status === "Delivered"
                            ? "bg-blue-100 text-blue-600"
                            : o.status === "Cancelled"
                            ? "bg-red-100 text-red-600"
                            : "bg-yellow-100 text-yellow-600"
                        }`}
                      >
                        {o.status}
                      </span>
                    </td>
                    <td className="p-3">₹{o.amount}</td>
                    <td className="p-3 text-sm text-gray-600">
                      {new Date(o.createdAt).toLocaleString()}
                    </td>
                    <td className="p-3">
                      {o.status === 'Pending' && (
                        <button onClick={() => updateStatus(o._id, 'Cancelled')} className="px-3 py-1 text-xs bg-red-600 text-white rounded">Cancel</button>
                      )}
                      <button onClick={() => setSelected(o)} className="ml-3 px-3 py-1 text-xs border rounded">View</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="mt-4 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Page {currentPage} of {totalPages}
          </div>
          <div className="flex items-center gap-2">
            <button
              disabled={currentPage === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-3 py-2 border rounded disabled:opacity-50"
            >
              Previous
            </button>
            <button
              disabled={currentPage === totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="px-3 py-2 border rounded disabled:opacity-50"
            >
              Next
            </button>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
              className="px-2 py-2 border rounded"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
            </select>
          </div>
        </div>
      </div>

      <OrderDetailsModal order={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
