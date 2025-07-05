const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const Order = require('../models/Order');
const InventoryMovement = require('../models/InventoryMovement');

// Add new order (creates products, adds to inventory)
router.post('/orders', async (req, res) => {
  try {
    const { customerName, customerContact, products, notes } = req.body;
    // products: [{ name, description, attributes, cost, price }]
    if (!products || !Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ error: 'At least one product is required' });
    }
    // Create products
    const createdProducts = await Product.insertMany(products.map(p => ({ ...p })));
    // Create order
    const totalAmount = createdProducts.reduce((sum, p) => sum + p.price, 0);
    const order = new Order({
      customerName,
      customerContact,
      products: createdProducts.map(p => p._id),
      totalAmount,
      notes
    });
    await order.save();
    // Link products to order
    await Product.updateMany({ _id: { $in: createdProducts.map(p => p._id) } }, { orderId: order._id });
    // Add inventory movements
    await InventoryMovement.insertMany(createdProducts.map(p => ({ product: p._id, type: 'added', reference: order._id })));
    res.status(201).json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Cancel order (updates order and inventory)
router.post('/orders/:id/cancel', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    order.status = 'cancelled';
    await order.save();
    // Update products
    await Product.updateMany({ _id: { $in: order.products } }, { status: 'cancelled' });
    // Add inventory movements
    await InventoryMovement.insertMany(order.products.map(pid => ({ product: pid, type: 'cancelled', reference: order._id })));
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Return product (updates product and inventory)
router.post('/products/:id/return', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    product.status = 'returned';
    await product.save();
    await InventoryMovement.create({ product: product._id, type: 'returned', reference: product.orderId });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// List inventory (all products)
router.get('/inventory', async (req, res) => {
  try {
    const products = await Product.find().populate('orderId');
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// List orders
router.get('/orders', async (req, res) => {
  try {
    const orders = await Order.find().populate('products');
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router; 