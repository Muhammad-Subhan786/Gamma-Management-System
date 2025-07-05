const mongoose = require('mongoose');

const inventoryMovementSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  type: {
    type: String,
    enum: ['added', 'sold', 'returned', 'cancelled'],
    required: true
  },
  quantity: { type: Number, default: 1 },
  reference: { type: String }, // e.g. orderId
  date: { type: Date, default: Date.now },
  notes: { type: String, trim: true }
}, { timestamps: true });

module.exports = mongoose.model('InventoryMovement', inventoryMovementSchema); 