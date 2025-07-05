const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  customerName: { type: String, required: true, trim: true },
  customerContact: { type: String, trim: true },
  products: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'delivered', 'cancelled', 'returned'],
    default: 'pending'
  },
  totalAmount: { type: Number, required: true },
  notes: { type: String, trim: true },
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema); 