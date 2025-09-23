import React from "react";
import { API_BASE_URL } from "../config";

export default function OrderDetailsModal({ order, onClose }) {
  if (!order) return null;

  function getImageUrl(img) {
    if (!img) return "";
    if (/^https?:\/\//i.test(img)) return img;
    const path = img.startsWith("/") ? img : `/${img}`;
    return `${API_BASE_URL}${path}`;
  }

  const steps = [
    { key: 'createdAt', label: 'Placed', at: order.createdAt },
    { key: 'shippedAt', label: 'Shipped', at: order.shippedAt },
    { key: 'deliveredAt', label: 'Delivered', at: order.deliveredAt },
    { key: 'cancelledAt', label: 'Cancelled', at: order.cancelledAt },
  ];

  function downloadInvoice() {
    const idShort = String(order._id).slice(-6).toUpperCase();
    const win = window.open('', 'PRINT', 'height=700,width=900');
    if (!win) return;
    const artisan = order.product?.artisan || {};
    const imgUrl = order.product?.image ? getImageUrl(order.product.image) : '';
    const html = `
      <html>
      <head>
        <title>Invoice ${idShort}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 24px; color: #111827; }
          .header { display:flex; justify-content:space-between; align-items:center; }
          .brand { font-weight: 800; font-size: 20px; }
          .muted { color:#6B7280; }
          .box { border:1px solid #E5E7EB; border-radius:12px; padding:16px; margin-top:16px; }
          .row { display:flex; gap:16px; }
          .col { flex:1; }
          .table { width:100%; border-collapse: collapse; margin-top:12px; }
          .table th, .table td { border-bottom:1px solid #E5E7EB; padding:8px; text-align:left; }
          .right { text-align:right; }
          .total { font-weight:700; }
          img.prod { width:80px; height:80px; object-fit:cover; border-radius:8px; border:1px solid #E5E7EB; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="brand">CraftConnect</div>
          <div>Invoice <strong>#${idShort}</strong><div class="muted">${new Date(order.createdAt).toLocaleString()}</div></div>
        </div>
        <div class="box row">
          <div class="col">
            <div class="muted">Billed To</div>
            <div><strong>${order.customerName || 'Customer'}</strong></div>
            ${order.customerEmail ? `<div class="muted">${order.customerEmail}</div>` : ''}
          </div>
          <div class="col">
            <div class="muted">Sold By</div>
            <div><strong>${artisan.name || 'Artisan'}</strong></div>
            ${artisan.email ? `<div class="muted">${artisan.email}</div>` : ''}
          </div>
        </div>
        <div class="box">
          <table class="table">
            <thead>
              <tr><th>Item</th><th>Qty</th><th class="right">Price</th><th class="right">Amount</th></tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  ${imgUrl ? `<img class="prod" src="${imgUrl}" alt="" />` : ''}
                  <div style="display:inline-block; margin-left:8px; vertical-align:top;">
                    <div><strong>${order.product?.name || 'Product'}</strong></div>
                  </div>
                </td>
                <td>1</td>
                <td class="right">₹${Number(order.amount).toFixed(2)}</td>
                <td class="right">₹${Number(order.amount).toFixed(2)}</td>
              </tr>
            </tbody>
            <tfoot>
              <tr><td colspan="3" class="right total">Total</td><td class="right total">₹${Number(order.amount).toFixed(2)}</td></tr>
            </tfoot>
          </table>
        </div>
        <p class="muted">Status: ${order.status}</p>
        <script>window.focus(); window.print(); window.onafterprint = () => window.close();<\/script>
      </body>
      </html>`;
    win.document.write(html);
    win.document.close();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h3 className="text-lg font-semibold">Order {String(order._id).slice(-6).toUpperCase()}</h3>
          <button onClick={onClose} className="p-2 rounded hover:bg-gray-100" aria-label="Close">✕</button>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex gap-4">
            {order.product?.image && (
              <img src={getImageUrl(order.product.image)} alt={order.product?.name}
                   className="w-28 h-28 rounded object-cover border" />
            )}
            <div className="flex-1">
              <div className="text-lg font-semibold">{order.product?.name || 'Product'}</div>
              <div className="text-sm text-gray-600">Amount: ₹{order.amount}</div>
              <div className="mt-1">
                <span className={`px-2 py-1 rounded text-xs ${
                  order.status === 'Shipped' ? 'bg-green-100 text-green-700' :
                  order.status === 'Delivered' ? 'bg-blue-100 text-blue-700' :
                  order.status === 'Cancelled' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                }`}>{order.status}</span>
              </div>
            </div>
          </div>

          {order.product?.artisan && (
            <div className="rounded-lg border p-4">
              <div className="font-medium mb-1">Artisan</div>
              <div className="text-sm text-gray-700">{order.product.artisan.name}</div>
              {order.product.artisan.email && (
                <div className="text-xs text-gray-500">{order.product.artisan.email}</div>
              )}
            </div>
          )}

          <div>
            <div className="font-medium mb-2">Timeline</div>
            <ol className="relative border-l border-gray-200 ml-3">
              {steps.filter(s => !!s.at).map((s, idx) => (
                <li key={s.key} className="mb-4 ml-4">
                  <div className="absolute -left-1.5 w-3 h-3 bg-indigo-500 rounded-full"></div>
                  <time className="mb-1 text-xs text-gray-500 block">{new Date(s.at).toLocaleString()}</time>
                  <p className="text-sm font-medium text-gray-900">{s.label}</p>
                </li>
              ))}
              {steps.every(s => !s.at) && (
                <li className="ml-4 text-sm text-gray-500">No timeline available.</li>
              )}
            </ol>
          </div>
        </div>

        <div className="px-6 py-4 border-t flex justify-between">
          <button onClick={downloadInvoice} className="px-4 py-2 rounded bg-indigo-600 text-white hover:bg-indigo-700">Download Invoice</button>
          <button onClick={onClose} className="px-4 py-2 rounded bg-gray-100 hover:bg-gray-200">Close</button>
        </div>
      </div>
    </div>
  );
}
