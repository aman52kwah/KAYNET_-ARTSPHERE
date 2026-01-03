// routes/admin.js
import 'dotenv/config';
import express from 'express';
const router = express.Router();
import db from '../models/index.js';

// Middleware to check if user is admin
const isAdmin = (req, res, next) => {
  console.log('=== ADMIN CHECK ===');
  console.log('Session User:', req.session?.user);
  console.log('User Role:', req.session?.user?.role);
  
  if (!req.session || !req.session.user) {
    return res.status(401).json({ message: 'Unauthorized - Please login first' });
  }
  
  if (req.session.user.role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden - Admin access required' });
  }
  
  req.user = req.session.user;
  next();
};

// Apply admin middleware to all routes
router.use(isAdmin);

// Get dashboard statistics
router.get('/stats', async (req, res) => {
  try {
    
    const orderModel = db.Orders;
    const customOrderModel = db.CustomOrder;

    // Get total orders count
    const totalOrders = await orderModel.count();
    
    // Get custom orders count
    const customOrders = await customOrderModel.count();
    
    // Calculate ready-made orders
    const readyMadeOrders = totalOrders;
    
    // Get pending orders count
    const pendingOrders = await orderModel.count({
      where: { status: 'pending' }
    });
    
    // Calculate total revenue from orders
    const orderRevenue = await orderModel.sum('totalAmount') || 0;
    
    // Calculate total revenue from custom orders
    const customOrderRevenue = await customOrderModel.sum('totalPrice') || 0;
    
    const totalRevenue = parseFloat(orderRevenue) + parseFloat(customOrderRevenue);
    
    // Get today's revenue
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayOrderRevenue = await orderModel.sum('totalAmount', {
      where: {
        createdAt: {
          [sequelize.Sequelize.Op.gte]: today
        }
      }
    }) || 0;
    
    const todayCustomOrderRevenue = await customOrderModel.sum('totalPrice', {
      where: {
        createdAt: {
          [sequelize.Sequelize.Op.gte]: today
        }
      }
    }) || 0;
    
    const todayRevenue = parseFloat(todayOrderRevenue) + parseFloat(todayCustomOrderRevenue);
    
    const stats = {
      totalOrders: totalOrders + customOrders,
      customOrders,
      readyMadeOrders,
      pendingOrders,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      todayRevenue: Math.round(todayRevenue * 100) / 100
    };
    
    res.json(stats);
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ 
      message: 'Error fetching dashboard stats', 
      error: error.message 
    });
  }
});

// Get recent orders (both regular and custom)
router.get('/orders/recent', async (req, res) => {
  try {
    const orderModel = db.Orders;
    const customOrderModel = db.CustomOrder;
    const userModel = db.User;
    const limit = parseInt(req.query.limit) || 10;

    // Fetch recent regular orders
    const regularOrders = await orderModel.findAll({
      include: [
        { 
          model: userModel,
          attributes: ['name', 'email']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: Math.ceil(limit / 2)
    });

    // Fetch recent custom orders
    const customOrders = await customOrderModel.findAll({
      include: [
        { 
          model: userModel,
          attributes: ['name', 'email']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: Math.ceil(limit / 2)
    });

    // Format regular orders
    const formattedRegularOrders = regularOrders.map(order => ({
      id: order.orderNumber || order.id,
      customer: order.User?.name || 'Unknown Customer',
      type: 'Ready-Made',
      amount: parseFloat(order.totalAmount),
      status: order.status.charAt(0).toUpperCase() + order.status.slice(1),
      date: order.createdAt
    }));

    // Format custom orders
    const formattedCustomOrders = customOrders.map(order => ({
      id: `CUSTOM-${order.id.slice(0, 8)}`,
      customer: order.User?.name || 'Unknown Customer',
      type: 'Custom',
      amount: parseFloat(order.totalPrice),
      status: order.status.charAt(0).toUpperCase() + order.status.slice(1),
      date: order.createdAt
    }));

    // Combine and sort by date
    const allOrders = [...formattedRegularOrders, ...formattedCustomOrders]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, limit);

    res.json(allOrders);
  } catch (error) {
    console.error('Error fetching recent orders:', error);
    res.status(500).json({ 
      message: 'Error fetching recent orders', 
      error: error.message 
    });
  }
});

// Get all orders (for admin management)
router.get('/orders', async (req, res) => {
  try {
    const orderModel = db.Orders;
    const orderItemsModel = db.OrderItems;
    const productModel = db.Products;
    const userModel =db.User;

    const orders = await orderModel.findAll({
      include: [
        {
          model: userModel,
          attributes: ['name', 'email']
        },
        {
          model: orderItemsModel,
          include: [
            {
              model: productModel,
              as: 'product'
            }
          ]
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json(orders);
  } catch (error) {
    console.error('Error fetching all orders:', error);
    res.status(500).json({ 
      message: 'Error fetching orders', 
      error: error.message 
    });
  }
});

// Get all custom orders (for admin management)
router.get('/custom-orders', async (req, res) => {
  try {
    const customOrderModel = db.CustomOrder;
    const userModel = db. User;
    const styleModel =db.Style;
    const materialModel = db.Material;

    const customOrders = await customOrderModel.findAll({
      include: [
        {
          model: userModel,
          attributes: ['name', 'email']
        },
        {
          model: styleModel
        },
        {
          model: materialModel
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json(customOrders);
  } catch (error) {
    console.error('Error fetching custom orders:', error);
    res.status(500).json({ 
      message: 'Error fetching custom orders', 
      error: error.message 
    });
  }
});

// Update order status
router.patch('/orders/:id/status', async (req, res) => {
  try {
    const orderModel = db.Orders;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ message: 'Status is required' });
    }

    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status.toLowerCase())) {
      return res.status(400).json({ 
        message: 'Invalid status. Must be one of: pending, processing, shipped, delivered, cancelled' 
      });
    }

    const order = await orderModel.findByPk(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    order.status = status.toLowerCase();
    await order.save();

    res.json({ 
      message: 'Order status updated successfully', 
      order 
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ 
      message: 'Error updating order status', 
      error: error.message 
    });
  }
});

// Update custom order status
router.patch('/custom-orders/:id/status', async (req, res) => {
  try {
    const customOrderModel = db.CustomOrder;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ message: 'Status is required' });
    }

    const validStatuses = ['pending', 'in_progress', 'completed', 'cancelled'];
    if (!validStatuses.includes(status.toLowerCase())) {
      return res.status(400).json({ 
        message: 'Invalid status. Must be one of: pending, in_progress, completed, cancelled' 
      });
    }

    const order = await customOrderModel.findByPk(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Custom order not found' });
    }

    order.status = status.toLowerCase();
    await order.save();

    res.json({ 
      message: 'Custom order status updated successfully', 
      order 
    });
  } catch (error) {
    console.error('Error updating custom order status:', error);
    res.status(500).json({ 
      message: 'Error updating custom order status', 
      error: error.message 
    });
  }
});

export default router;