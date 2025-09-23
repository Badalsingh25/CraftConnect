import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
  artisan: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  customerName: { type: String, required: true },
  customerEmail: { type: String },
  amount: { type: Number, required: true },
  // Coupon info (optional). We apply the total discount to the first order in a payment.
  couponId: { type: mongoose.Schema.Types.ObjectId, ref: 'Coupon', default: null },
  couponCode: { type: String, default: null },
  discount: { type: Number, default: 0 },
  couponCounted: { type: Boolean, default: false },
  status: { type: String, enum: ["Pending", "Shipped", "Delivered", "Cancelled"], default: "Pending" },
  paymentId: { type: String },
  paymentVerified: { type: Boolean, default: false },
  shippedAt: { type: Date },
  deliveredAt: { type: Date },
  cancelledAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Order", orderSchema);

