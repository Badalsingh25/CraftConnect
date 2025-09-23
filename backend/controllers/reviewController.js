import Review from "../models/Review.js";
import Product from "../models/productModel.js";

export async function listReviews(req, res) {
  try {
    const { status } = req.query; // 'all' | 'pending' | 'approved'
    const filter = {};
    if (status === 'pending') filter.isApproved = false;
    if (status === 'approved') filter.isApproved = true;
    const items = await Review.find(filter)
      .populate('product', 'name')
      .populate('user', 'name email')
      .sort({ createdAt: -1 });
    res.json(items);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Server error' });
  }
}

export async function setReviewApproval(req, res) {
  try {
    const { id } = req.params;
    const { isApproved } = req.body;
    const r = await Review.findByIdAndUpdate(id, { isApproved: !!isApproved }, { new: true });
    if (!r) return res.status(404).json({ message: 'Not found' });
    // Update product aggregates after approval changes
    const agg = await Review.aggregate([
      { $match: { product: r.product, isApproved: true } },
      { $group: { _id: '$product', avg: { $avg: '$rating' }, count: { $sum: 1 } } }
    ]);
    if (agg.length > 0) {
      await Product.findByIdAndUpdate(r.product, { rating: Number(agg[0].avg.toFixed(1)), ratingCount: agg[0].count });
    }
    res.json(r);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Server error' });
  }
}
