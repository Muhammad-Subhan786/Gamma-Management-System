const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  category: { type: String, required: true, trim: true },
  quantity: { type: Number, required: true, default: 0 },
  cost: { type: Number, required: true },
  price: { type: Number, required: true },
  image: { type: String, default: '' },
  attributes: { type: Object, default: {} }, // e.g. { material, size, engraving, color }
  status: {
    type: String,
    enum: ['in_stock', 'low_stock', 'out_of_stock', 'sold', 'returned', 'cancelled'],
    default: 'in_stock'
  },
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema); 