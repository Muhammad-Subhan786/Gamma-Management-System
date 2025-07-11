const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const Order = require('../models/Order');
const InventoryMovement = require('../models/InventoryMovement');
const multer = require('multer');
const path = require('path');

// Multer storage for product images
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads/profiles');
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'product-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

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

// Add individual product to inventory
router.post('/products', async (req, res) => {
  try {
    const { name, description, category, quantity, cost, price, image } = req.body;
    
    if (!name || !category || !quantity || !cost || !price) {
      return res.status(400).json({ error: 'Name, category, quantity, cost, and price are required' });
    }
    
    // Determine status based on quantity
    let status = 'in_stock';
    if (quantity <= 0) {
      status = 'out_of_stock';
    } else if (quantity <= 5) {
      status = 'low_stock';
    }
    
    const product = new Product({
      name,
      description: description || '',
      category,
      quantity: parseInt(quantity),
      cost: parseFloat(cost),
      price: parseFloat(price),
      image: image || '',
      status,
      orderId: null // Not linked to any order initially
    });
    
    await product.save();
    
    // Add inventory movement
    await InventoryMovement.create({
      product: product._id,
      type: 'added',
      reference: null,
      quantity: parseInt(quantity)
    });
    
    res.status(201).json(product);
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update product
router.put('/products/:id', async (req, res) => {
  try {
    const { name, description, category, quantity, cost, price, image, status } = req.body;
    
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    // Update fields
    if (name) product.name = name;
    if (description !== undefined) product.description = description;
    if (category) product.category = category;
    if (quantity !== undefined) {
      product.quantity = parseInt(quantity);
      // Update status based on new quantity
      if (quantity <= 0) {
        product.status = 'out_of_stock';
      } else if (quantity <= 5) {
        product.status = 'low_stock';
      } else {
        product.status = 'in_stock';
      }
    }
    if (cost !== undefined) product.cost = parseFloat(cost);
    if (price !== undefined) product.price = parseFloat(price);
    if (image !== undefined) product.image = image;
    if (status) product.status = status;
    
    await product.save();
    res.json(product);
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete product
router.delete('/products/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    await Product.findByIdAndDelete(req.params.id);
    
    // Add inventory movement for deletion
    await InventoryMovement.create({
      product: product._id,
      type: 'deleted',
      reference: null,
      quantity: 0
    });
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get single product
router.get('/products/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('orderId');
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(product);
  } catch (error) {
    console.error('Error getting product:', error);
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

// Product image upload endpoint
router.post('/products/upload', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  const imageUrl = `/uploads/profiles/${req.file.filename}`;
  res.json({ imageUrl });
});

module.exports = router; 