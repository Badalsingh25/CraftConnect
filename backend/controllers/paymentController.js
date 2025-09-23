import Razorpay from 'razorpay';
import crypto from 'crypto';
import Order from '../models/Order.js';
import Coupon from '../models/Coupon.js';

export function getPaymentConfig(req, res) {
  const keyId = process.env.RAZORPAY_KEY_ID || '';
  res.json({ keyId, enabled: Boolean(keyId && process.env.RAZORPAY_KEY_SECRET) });
}

// Razorpay webhook: configured to receive raw body (set in server.js)
export async function razorpayWebhook(req, res) {
  try {
    const signature = req.headers['x-razorpay-signature'];
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!secret) return res.status(400).send('Webhook not configured');
    const rawBody = req.body; // Buffer from express.raw
    const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
    if (expected !== signature) return res.status(400).send('Invalid signature');

    const event = JSON.parse(rawBody.toString('utf8'));
    if (event?.entity === 'event' && event?.type?.startsWith('payment.')) {
      const paymentId = event?.payload?.payment?.entity?.id;
      if (paymentId) {
        try {
          // Mark verified
          await Order.updateMany({ paymentId }, { $set: { paymentVerified: true } });
          // Increment coupon usage once per payment if any one order has couponId and not counted yet
          const one = await Order.findOne({ paymentId, couponId: { $ne: null }, couponCounted: false });
          if (one && one.couponId) {
            await Coupon.findByIdAndUpdate(one.couponId, { $inc: { usedCount: 1 } });
            await Order.updateMany({ paymentId, couponId: one.couponId, couponCounted: false }, { $set: { couponCounted: true } });
          }
        } catch (e) {
          console.error('Failed to mark orders verified for payment', paymentId, e.message);
        }
      }
    }
    res.status(200).send('ok');
  } catch (e) {
    console.error('Webhook error', e);
    res.status(500).send('error');
  }
}

export async function createRazorpayOrder(req, res) {
  try {
    // Accept subtotal and optional coupon details. Backward compatible with 'amount'.
    let { subtotal, couponCode } = req.body;
    let amount = req.body.amount; // legacy
    if (!amount) amount = subtotal;
    const sub = Number(amount || 0);
    if (!sub || sub <= 0) return res.status(400).json({ message: 'Amount is required' });
    let discount = 0;
    let appliedCoupon = null;
    if (couponCode) {
      const code = String(couponCode).toUpperCase().trim();
      const coupon = await Coupon.findOne({ code, active: true });
      if (coupon) {
        // Validate minSubtotal and expiry/usage
        if (!coupon.expiresAt || coupon.expiresAt >= new Date()) {
          if (!(coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit)) {
            if (sub >= (coupon.minSubtotal || 0)) {
              discount = coupon.type === 'percent' ? Math.floor((sub * Number(coupon.amount || 0)) / 100) : Math.min(sub, Number(coupon.amount || 0));
              appliedCoupon = coupon;
            }
          }
        }
      }
    }
    const payable = Math.max(0, sub - discount);
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      return res.status(400).json({ message: 'Payment not configured' });
    }
    const instance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
    const order = await instance.orders.create({
      amount: Math.round(Number(payable) * 100),
      currency: 'INR',
      receipt: `rcpt_${Date.now()}`,
    });
    res.json({
      order,
      keyId: process.env.RAZORPAY_KEY_ID,
      subtotal: sub,
      discount,
      payable,
      coupon: appliedCoupon ? {
        id: appliedCoupon._id,
        code: appliedCoupon.code,
        type: appliedCoupon.type,
        amount: appliedCoupon.amount,
      } : null,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Failed to create payment order' });
  }
}

export async function verifyRazorpaySignature(req, res) {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    if (!process.env.RAZORPAY_KEY_SECRET) return res.status(400).json({ message: 'Payment not configured' });
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ message: 'Missing payment params' });
    }
    const payload = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expected = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET).update(payload).digest('hex');
    const valid = expected === razorpay_signature;
    if (!valid) return res.status(400).json({ message: 'Invalid signature' });
    res.json({ valid: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Verification failed' });
  }
}
