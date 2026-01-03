// routes/orders.js
import 'dotenv/config';
import express from 'express';
const router = express.Router();
import db from '../models/index.js';

// Middleware to check authentication (add this at the top)
const isAuthenticated = (req, res, next) => {
  console.log('=== AUTH CHECK IN ORDERS ===');
  console.log('Session:', req.session);
  console.log('Session User:', req.session?.user);
  console.log('req.user:', req.user);
  console.log('Is Authenticated:', req.isAuthenticated ? req.isAuthenticated() : 'N/A');
  
  // Check both session.user and req.user (for compatibility)
  if ((req.session && req.session.user) || (req.isAuthenticated && req.isAuthenticated())) {
    // Ensure req.user is set
    if (!req.user && req.session.user) {
      req.user = req.session.user;
    }
    return next();
  }
  
  console.log('❌ Authentication failed in orders route');
  res.status(401).json({ message: 'Unauthorized - Please login first' });
};

// Apply authentication middleware to all routes
router.use(isAuthenticated);

// Create order
router.post('/', async (req, res) => {
  try {
    const productModel = db.Products;
    const orderModel =db.Orders;
    const orderItemsModel =db.OrderItems;
    console.log('Creating order for user:', req.user);
    
    const { items, shippingAddress } = req.body;
    
    // Validation
    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'No items in order' });
    }
    
    if (!shippingAddress) {
      return res.status(400).json({ message: 'Shipping address is required' });
    }

    let totalAmount = 0;
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    
    // Calculate total and validate stock
    for (const item of items) {
      const product = await productModel.findByPk(item.productId);
      
      if (!product) {
        return res.status(404).json({
          message: `Product with ID ${item.productId} not found`
        });
      }
      
      if (product.stockQuantity < item.quantity) {
        return res.status(400).json({
          message: `${product.name} is out of stock. Only ${product.stockQuantity} available.`
        });
      }
      
      totalAmount += parseFloat(product.price) * item.quantity;
    }
    
    // Create order
    const order = await orderModel.create({
      userId: req.user.id,
      orderNumber,
      totalAmount: totalAmount.toFixed(2),
      shippingAddress,
      status: 'paid'
    });

    console.log('Order created:', order.id);

    // Create order items and update stock
    for (const item of items) {
      const product = await productModel.findByPk(item.productId);
      
      await orderItemsModel.create({
        orderId: order.id,
        productId: item.productId,
        quantity: item.quantity,
        price: product.price
      });

      // Update stock
      product.stockQuantity -= item.quantity;
      await product.save();
      
      console.log(`Updated stock for ${product.name}: ${product.stockQuantity} remaining`);
    }
    
    res.status(201).json(order);
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ 
      message: 'Error creating order', 
      error: error.message 
    });
  }
});

// Get user's orders
router.get('/', async (req, res) => {
  try {
     constdb = await model;
    const orderModel =db.Orders;
    const orderItemsModel =db.OrderItems;
    const productModel = db.Products
    const orders = await orderModel.findAll({
      where: { userId: req.user.id },
      include: [
        { model: orderItemsModel, as:'orderItems',
          include: [{model: productModel,
             as: 'product'}] 
        }
      ],
      order: [['createdAt', 'DESC']]
    });
    
    res.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ 
      message: 'Error fetching orders', 
      error: error.message 
    });
  }
});

// Get single order
// Get single order
router.get('/:id', async (req, res) => {
  try {
    
    const orderModel =db.Orders;
    const orderItemsModel =db.OrderItems;
    const productModel =db.Products;
    
    const order = await orderModel.findOne({
      where: { 
        id: req.params.id, 
        userId: req.user.id 
      },
      include: [
        { 
          model: orderItemsModel,as:'orderItems', 
          include: [{ 
            model: productModel,  // Add this
            as: 'product' 
          }] 
        }
      ]
    });
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    res.json(order);
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ 
      message: 'Error fetching order', 
      error: error.message 
    });
  }
});

export default router;