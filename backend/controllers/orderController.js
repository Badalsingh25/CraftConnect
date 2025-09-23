import Order from "../models/Order.js";
import Product from "../models/productModel.js";
import nodemailer from "nodemailer";

// Get orders for the logged-in artisan
export const getMyOrders = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const pageSize = Math.min(50, Math.max(1, parseInt(req.query.pageSize) || 10));
    const status = req.query.status && req.query.status !== 'all' ? req.query.status : undefined;
    const sortParam = req.query.sort || 'placed_desc';
    const sortMap = {
      placed_desc: { createdAt: -1 },
      placed_asc: { createdAt: 1 },
      amount_desc: { amount: -1 },
      amount_asc: { amount: 1 },
      status_asc: { status: 1, createdAt: -1 },
      status_desc: { status: -1, createdAt: -1 },
    };
    const sortBy = sortMap[sortParam] || sortMap.placed_desc;

    const filter = { artisan: req.user._id };
    if (status) filter.status = status;

    const total = await Order.countDocuments(filter);
    const items = await Order.find(filter)
      .populate({ path: 'product', select: 'name image artisan', populate: { path: 'artisan', select: 'name email avatar' }})
      .sort(sortBy)
      .skip((page - 1) * pageSize)
      .limit(pageSize);
    res.json({ items, total, page, pageSize });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get orders placed by the current customer with pagination/filter/sort
export const getCustomerOrders = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const pageSize = Math.min(50, Math.max(1, parseInt(req.query.pageSize) || 10));
    const status = req.query.status && req.query.status !== 'all' ? req.query.status : undefined;
    const sortParam = req.query.sort || 'placed_desc';
    const sortMap = {
      placed_desc: { createdAt: -1 },
      placed_asc: { createdAt: 1 },
      amount_desc: { amount: -1 },
      amount_asc: { amount: 1 },
      status_asc: { status: 1, createdAt: -1 },
      status_desc: { status: -1, createdAt: -1 },
    };
    const sortBy = sortMap[sortParam] || sortMap.placed_desc;

    const filter = { customer: req.user._id };
    if (status) filter.status = status;

    const total = await Order.countDocuments(filter);
    const items = await Order.find(filter)
      .populate({ path: 'product', select: 'name image artisan', populate: { path: 'artisan', select: 'name email avatar' }})
      .sort(sortBy)
      .skip((page - 1) * pageSize)
      .limit(pageSize);
    res.json({ items, total, page, pageSize });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update order status (artisan can manage their own orders)
export const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const order = await Order.findById(id);
    if (!order) return res.status(404).json({ message: "Order not found" });
    // Authorization:
    // - Artisan owner can update statuses according to allowed transitions
    // - Customer who placed the order can only cancel when it's still Pending
    const isArtisanOwner = String(order.artisan) === String(req.user._id);
    const isCustomer = String(order.customer) === String(req.user._id);
    const isCustomerAllowed = isCustomer && order.status === 'Pending' && status === 'Cancelled';
    if (!isArtisanOwner && !isCustomerAllowed) {
      return res.status(403).json({ message: "Not authorized to update this order" });
    }

    const allowed = ["Pending", "Shipped", "Delivered", "Cancelled"];
    if (!allowed.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    // Allowed transitions for artisan: Pending->Shipped->Delivered; Pending->Cancelled
    const current = order.status;
    let canTransition = false;
    if (isArtisanOwner) {
      canTransition = (
        (current === "Pending" && (status === "Shipped" || status === "Cancelled")) ||
        (current === "Shipped" && status === "Delivered") ||
        current === status
      );
    } else if (isCustomerAllowed) {
      canTransition = true; // Pending -> Cancelled by customer
    }
    if (!canTransition) {
      return res.status(400).json({ message: `Cannot change status from ${current} to ${status}` });
    }

    order.status = status;
    if (status === 'Shipped') order.shippedAt = new Date();
    if (status === 'Delivered') order.deliveredAt = new Date();
    if (status === 'Cancelled') order.cancelledAt = new Date();
    await order.save();
    const populated = await order.populate({ path: 'product', select: 'name image artisan', populate: { path: 'artisan', select: 'name email avatar' }});

    // Send customer notification email if email configured and present
    try {
      if (order.customerEmail && process.env.ADMIN_EMAIL && process.env.ADMIN_EMAIL_APP_PASSWORD) {
        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: { user: process.env.ADMIN_EMAIL, pass: process.env.ADMIN_EMAIL_APP_PASSWORD },
        });
        await transporter.sendMail({
          from: process.env.ADMIN_EMAIL,
          to: order.customerEmail,
          subject: `Your order ${String(order._id).slice(-6).toUpperCase()} is ${status}`,
          html: `<p>Hi ${order.customerName || 'there'},</p>
                 <p>Your order status has been updated to <b>${status}</b>.</p>
                 <p>Product: ${populated.product?.name || 'Item'}</p>
                 <p>Amount: ₹${order.amount}</p>
                 <p>Thanks for shopping with CraftConnect.</p>`
        });
      }
    } catch (mailErr) {
      console.error('Email notification failed:', mailErr.message);
    }

    res.json({ message: 'Order status updated', order: populated });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Create orders from cart items for the current customer
export const createOrders = async (req, res) => {
  try {
    const { items, customerName, paymentId, coupon } = req.body; // coupon: { id, code, discount }
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "No items to place order" });
    }

    const created = [];
    let remainingDiscount = Math.max(0, Number(coupon?.discount || 0));
    for (const it of items) {
      const product = await Product.findById(it._id).populate('artisan', '_id');
      if (!product) continue;
      const quantity = Math.max(1, Number(it.quantity) || 1);
      const gross = Number(product.price || 0) * quantity;
      let applied = 0;
      // We apply the entire discount to the first order only (simplest allocation)
      if (created.length === 0 && remainingDiscount > 0) {
        applied = Math.min(remainingDiscount, gross);
        remainingDiscount -= applied;
      }
      const amount = Math.max(0, gross - applied);

      const order = await Order.create({
        product: product._id,
        artisan: product.artisan._id || product.artisan,
        customerName: customerName || req.user?.name || "Customer",
        customerEmail: req.user?.email || undefined,
        customer: req.user?._id,
        amount,
        couponId: coupon?.id || null,
        couponCode: coupon?.code || null,
        discount: applied,
        status: "Pending",
        paymentId: paymentId || undefined,
      });
      created.push(order);
    }

    const populated = await Order.find({ _id: { $in: created.map(o => o._id) } })
      .populate({ path: 'product', select: 'name image artisan', populate: { path: 'artisan', select: 'name email avatar' }})
      .sort({ createdAt: -1 });

    // Send confirmation emails (best-effort)
    try {
      if (process.env.ADMIN_EMAIL && process.env.ADMIN_EMAIL_APP_PASSWORD) {
        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: { user: process.env.ADMIN_EMAIL, pass: process.env.ADMIN_EMAIL_APP_PASSWORD },
        });
        // Customer summary
        if (req.user?.email) {
          const totalAmount = populated.reduce((sum, o) => sum + (o.amount || 0), 0);
          const lines = populated.map(o => `• ${o.product?.name || 'Item'} — ₹${o.amount}`).join('<br/>');
          await transporter.sendMail({
            from: process.env.ADMIN_EMAIL,
            to: req.user.email,
            subject: `Your CraftConnect Order (${String(populated[0]?._id || '').slice(-6).toUpperCase()})`,
            html: `<p>Hi ${customerName || req.user?.name || 'there'},</p>
                   <p>Thank you for your purchase! Here is your order summary:</p>
                   <p>${lines}</p>
                   <p><b>Total:</b> ₹${totalAmount}</p>
                   ${paymentId ? `<p><b>Payment ID:</b> ${paymentId}</p>` : ''}
                   <p>We will notify you when your items are shipped.</p>`
          });
        }
        // Notify each artisan per order
        for (const o of populated) {
          const artisanEmail = o.product?.artisan?.email;
          if (artisanEmail) {
            await transporter.sendMail({
              from: process.env.ADMIN_EMAIL,
              to: artisanEmail,
              subject: `New Order Received: ${o.product?.name || 'Item'}`,
              html: `<p>Hi ${o.product?.artisan?.name || 'Artisan'},</p>
                     <p>You received a new order for <b>${o.product?.name || 'your product'}</b>.</p>
                     <p><b>Customer:</b> ${customerName || req.user?.name || 'Customer'} (${req.user?.email || ''})</p>
                     <p><b>Amount:</b> ₹${o.amount}</p>
                     ${paymentId ? `<p><b>Payment ID:</b> ${paymentId}</p>` : ''}
                     <p>Please prepare for shipment.</p>`
            });
          }
        }
      }
    } catch (mailErr) {
      console.error('Order email failed:', mailErr.message);
    }

    res.status(201).json({ message: "Order placed", orders: populated });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

