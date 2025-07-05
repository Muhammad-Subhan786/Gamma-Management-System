const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  attributes: { type: Object, default: {} }, // e.g. { material, size, engraving, color }
  cost: { type: Number, required: true },
  price: { type: Number, required: true },
  status: {
    type: String,
    enum: ['in_stock', 'sold', 'returned', 'cancelled'],
    default: 'in_stock'
  },
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema); 