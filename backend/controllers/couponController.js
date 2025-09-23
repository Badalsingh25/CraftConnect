import Coupon from "../models/Coupon.js";

export async function validateCoupon(req, res) {
  try {
    const { code, subtotal } = req.body;
    if (!code) return res.status(400).json({ message: 'Coupon code is required' });
    const coupon = await Coupon.findOne({ code: String(code).toUpperCase().trim(), active: true });
    if (!coupon) return res.status(404).json({ message: 'Coupon not found' });
    if (coupon.expiresAt && coupon.expiresAt < new Date()) {
      return res.status(400).json({ message: 'Coupon expired' });
    }
    if (coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit) {
      return res.status(400).json({ message: 'Coupon usage limit reached' });
    }
    const sub = Number(subtotal || 0);
    if (sub < coupon.minSubtotal) {
      return res.status(400).json({ message: `Minimum subtotal ₹${coupon.minSubtotal} required` });
    }
    res.json({
      id: coupon._id,
      code: coupon.code,
      type: coupon.type,
      amount: coupon.amount,
      minSubtotal: coupon.minSubtotal,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Server error' });
  }
}

export async function listCoupons(req, res) {
  try {
    const items = await Coupon.find({}).sort({ createdAt: -1 });
    res.json(items);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Server error' });
  }
}

export async function createCoupon(req, res) {
  try {
    const { code, type, amount, minSubtotal, expiresAt, active, usageLimit } = req.body;
    if (!code || !type || amount == null) return res.status(400).json({ message: 'Missing fields' });
    const coupon = await Coupon.create({
      code: String(code).toUpperCase().trim(),
      type,
      amount,
      minSubtotal: minSubtotal || 0,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      active: active !== false,
      usageLimit: usageLimit || 0,
    });
    res.status(201).json(coupon);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Server error' });
  }
}

export async function updateCoupon(req, res) {
  try {
    const { id } = req.params;
    const patch = req.body || {};
    if (patch.code) patch.code = String(patch.code).toUpperCase().trim();
    const coupon = await Coupon.findByIdAndUpdate(id, patch, { new: true });
    if (!coupon) return res.status(404).json({ message: 'Not found' });
    res.json(coupon);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Server error' });
  }
}

export async function deleteCoupon(req, res) {
  try {
    const { id } = req.params;
    const c = await Coupon.findById(id);
    if (!c) return res.status(404).json({ message: 'Not found' });
    await c.deleteOne();
    res.json({ message: 'Deleted' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Server error' });
  }
}
