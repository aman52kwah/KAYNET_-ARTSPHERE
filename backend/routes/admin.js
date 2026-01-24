
// routes/admin.js - TEMPORARY TEST VERSION (Remove auth check)
import 'dotenv/config';
import express from 'express';
import { Op } from 'sequelize';
const router = express.Router();
import models from "../models/index.js";

// TEMPORARY: Comment out admin middleware for testing
const isAdmin = (req, res, next) => {
  console.log('=== ADMIN CHECK (BYPASSED FOR TESTING) ===');
  console.log('Session User:', req.session?.user);
  console.log('User Role:', req.session?.user?.role);
  
  // TEMPORARY: Skip auth check for testing
  next();
  return;
  
  // Original auth code (commented out for testing)
  /*
  if (!req.session || !req.session.user) {
    return res.status(401).json({ message: 'Unauthorized - Please login first' });
  }
  
  if (req.session.user.role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden - Admin access required' });
  }
  
  req.user = req.session.user;
  next();
  */
};

// Apply admin middleware to all routes
router.use(isAdmin);

// Get dashboard statistics - FIXED PATH
router.get("/dashboard/stats", async (req, res) => {
  try {
    console.log('📊 Fetching dashboard stats...');
    const dbModels = await models;
    const orderModel = dbModels.Orders;
    const customOrderModel = dbModels.CustomOrder;

    // Get total orders count
    const totalOrders = await orderModel.count();

    // Get custom orders count
    const customOrders = await customOrderModel.count();

    // Calculate ready-made orders
    const readyMadeOrders = totalOrders;

    // Get pending orders count
    const pendingOrders = await orderModel.count({
      where: { status: "pending" },
    });

    // Calculate total revenue from orders
    const orderRevenue = (await orderModel.sum("totalAmount")) || 0;

    // Calculate total revenue from custom orders
    const customOrderRevenue = (await customOrderModel.sum("totalAmount")) || 0;

    const totalRevenue =
      parseFloat(orderRevenue) + parseFloat(customOrderRevenue);

    // Get today's revenue
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayOrderRevenue =
      (await orderModel.sum("totalAmount", {
        where: {
          createdAt: {
            [Op.gte]: today,
          },
        },
      })) || 0;

    const todayCustomOrderRevenue =
      (await customOrderModel.sum("totalAmount", {
        where: {
          createdAt: {
            [Op.gte]: today,
          },
        },
      })) || 0;

    const todayRevenue =
      parseFloat(todayOrderRevenue) + parseFloat(todayCustomOrderRevenue);

    const stats = {
      totalOrders: totalOrders + customOrders,
      customOrders,
      readyMadeOrders,
      pendingOrders,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      todayRevenue: Math.round(todayRevenue * 100) / 100,
    };

    console.log('✅ Stats fetched successfully:', stats);
    res.json(stats);
  } catch (error) {
    console.error("❌ Error fetching dashboard stats:", error);
    res.status(500).json({
      message: "Error fetching dashboard stats",
      error: error.message,
    });
  }
});

// Get recent orders (both regular and custom)
router.get("/orders/recent", async (req, res) => {
  try {
    console.log('📋 Fetching recent orders...');
    const dbModels = await models;
    const orderModel = dbModels.Orders;
    const customOrderModel = dbModels.CustomOrder;
    const userModel = dbModels.User;
    const limit = parseInt(req.query.limit) || 10;

    // Fetch recent regular orders
    const regularOrders = await orderModel.findAll({
      include: [
        {
          model: userModel,
          as: 'user',
          attributes: ["name", "email"],
        },
      ],
      order: [["createdAt", "DESC"]],
      limit: Math.ceil(limit / 2),
    });

    // Fetch recent custom orders
    const customOrders = await customOrderModel.findAll({
      include: [
        {
          model: userModel,
          as: 'user',
          attributes: ["name", "email"],
        },
      ],
      order: [["createdAt", "DESC"]],
      limit: Math.ceil(limit / 2),
    });

    // Format regular orders
    const formattedRegularOrders = regularOrders.map((order) => ({
      id: order.orderNumber || order.id,
      customer: order.user?.name || order.User?.name || "Unknown Customer",
      type: "Ready-Made",
      amount: parseFloat(order.totalAmount || 0),
      status: order.status.charAt(0).toUpperCase() + order.status.slice(1),
      date: order.createdAt,
    }));

    // Format custom orders
    const formattedCustomOrders = customOrders.map((order) => ({
      id: `CUSTOM-${order.id.slice(0, 8)}`,
      customer: order.user?.name || order.User?.name || "Unknown Customer",
      type: "Custom",
      amount: parseFloat(order.totalAmount || 0),
      status: order.status.charAt(0).toUpperCase() + order.status.slice(1),
      date: order.createdAt,
    }));

    // Combine and sort by date
    const allOrders = [...formattedRegularOrders, ...formattedCustomOrders]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, limit);

    console.log(`✅ Fetched ${allOrders.length} recent orders`);
    res.json(allOrders);
  } catch (error) {
    console.error("❌ Error fetching recent orders:", error);
    res.status(500).json({
      message: "Error fetching recent orders",
      error: error.message,
    });
  }
});

// Get all orders (for admin management)
router.get('/orders', async (req, res) => {
  try {
    const dbModels = await models;
    const orderModel = dbModels.Orders;
    const orderItemsModel = dbModels.OrderItems;
    const productModel = dbModels.Products;
    const userModel = dbModels.User;

    const orders = await orderModel.findAll({
      include: [
        {
          model: userModel,
          as: 'user',
          attributes: ['name', 'email']
        },
        {
          model: orderItemsModel,
          as: 'OrderItems',
          include: [
            {
              model: productModel,
              as: 'Products'
            }
          ]
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json(orders);
  } catch (error) {
    console.error('Error fetching all orders by admin:', error);
    res.status(500).json({ 
      message: 'Error fetching orders by admin', 
      error: error.message 
    });
  }
});

// Add this endpoint to your routes/admin.js file
// Add it RIGHT AFTER the GET /orders endpoint (around line 240)

// Get specific order by ID (for admin) - ADD THIS NEW ENDPOINT
router.get('/orders/:orderId', async (req, res) => {
  try {
    const dbModels = await models;
    const orderModel = dbModels.Orders;
    const orderItemsModel = dbModels.OrderItems;
    const productModel = dbModels.Products;
    const userModel = dbModels.User;

    const order = await orderModel.findByPk(req.params.orderId, {
      include: [
        {
          model: userModel,
          as: 'user',
          attributes: ['name', 'email', 'phone'],
          required: false,
        },
        {
          model: orderItemsModel,
          as: 'OrderItems',
          include: [
            {
              model: productModel,
              as: 'Products',
              attributes: ['name', 'imageUrl', 'price'],
              required: false,
            }
          ],
          required: false,
        }
      ]
    });

    if (!order) {
      console.log('❌ Order not found');
      return res.status(404).json({ message: 'Order not found' });
    }

    console.log('✅ Order found:', order.id);
    
    // Calculate financial breakdown
    const subtotal = parseFloat(order.totalAmount || 0);
    const shipping = 20; // Fixed shipping cost (GH₵ 20)
    const taxRate = 0.10; // 10% tax rate
    const tax = Math.round((subtotal * taxRate) * 100) / 100; // 10% of subtotal
    const grandTotal = Math.round((subtotal + shipping + tax) * 100) / 100; // Total with tax & shipping
    
    console.log('💰 Financial Breakdown:', { subtotal, shipping, tax, grandTotal });
    
    // Format the response to match the frontend expectations
    const formattedOrder = {
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      paymentStatus: order.paymentStatus,
      createdAt: order.createdAt,
      totalAmount: order.totalAmount,
      shippingAddress: order.shippingAddress,
      
      // Customer info
      customer: {
        name: order.user?.name || 'Unknown',
        email: order.user?.email || 'N/A',
        phone: order.user?.phone || 'N/A',
      },
      
      // Order items
      items: order.OrderItems?.map(item => ({
        id: item.id,
        productName: item.Products?.name || 'Unknown Product',
        quantity: item.quantity,
        price: parseFloat(item.price || item.Products?.price || 0),
        imageUrl: item.Products?.imageUrl,
      })) || [],
      
      // Payment info
      payment: {
        method: 'Paystack',
        status: order.paymentStatus || 'pending',
        amount: grandTotal, // Total amount customer pays (includes tax & shipping)
      },
      
      // Shipping address formatted
      shippingAddress: parseShippingAddress(order.shippingAddress),
      
      // Financial breakdown with calculated tax
      subtotal: subtotal,         // Items total
      shipping: shipping,         // Fixed GH₵ 20
      tax: tax,                   // 10% of subtotal
      total: grandTotal,          // Subtotal + Shipping + Tax
    };
    
    res.json(formattedOrder);
  } catch (error) {
    console.error('❌ Error fetching order details:', error);
    res.status(500).json({ 
      message: 'Error fetching order details', 
      error: error.message 
    });
  }
});

// Helper function to parse shipping address (keep this the same)
function parseShippingAddress(addressString) {
  if (!addressString) {
    return {
      street: 'N/A',
      city: 'N/A',
      state: 'N/A',
      zipCode: 'N/A',
      country: 'Ghana'
    };
  }
  
  // Address format: "Name, Phone, Address, City, Region"
  const parts = addressString.split(',').map(p => p.trim());
  
  return {
    street: parts[2] || 'N/A',
    city: parts[3] || 'N/A',
    state: parts[4] || 'N/A',
    zipCode: '',
    country: 'Ghana'
  };
}

// Get all custom orders (for admin management)
// routes/admin.js - SIMPLIFIED VERSION FOR DEBUGGING
// Replace your /custom-orders GET endpoint with this:

// Get all custom orders (for admin management) - SIMPLE VERSION
router.get('/custom-orders', async (req, res) => {
  try {
    console.log('📦 Fetching custom orders for admin (simplified)...');
    const dbModels = await models;
    const customOrderModel = dbModels.CustomOrder;

    // First, try without any associations
    const customOrders = await customOrderModel.findAll({
      order: [['createdAt', 'DESC']]
    });

    console.log(`✅ Found ${customOrders.length} custom orders`);
    console.log('Sample order:', customOrders[0] ? JSON.stringify(customOrders[0], null, 2) : 'No orders');
    
    res.json(customOrders);
  } catch (error) {
    console.error("❌ Error fetching custom orders for admin:", error);
    console.error("Error message:", error.message);
    console.error("Error name:", error.name);
    res.status(500).json({
      message: "Error fetching custom orders for admin",
      error: error.message,
      errorType: error.name
    });
  }
});



// POST /api/products - Create a new product
// POST /api/admin/products - Create a new product
// POST /api/admin/products - Create a new product
router.post('/products', async (req, res) => {
  try {
    console.log('📦 Creating new product...');
    console.log('Request body:', req.body);
    
    const { name, price, categoryId, stock, sizes, description, imageUrl } = req.body;

    // Validation
    if (!name || !price || !categoryId || stock === undefined || !sizes || sizes.length === 0) {
      return res.status(400).json({ 
        message: 'Missing required fields: name, price, categoryId, stock, and sizes are required' 
      });
    }

    const dbModels = await models;
    const productModel = dbModels.Products;
    const categoryModel = dbModels.Category;

    // Create the product
    const newProduct = await productModel.create({
      name,
      price: parseFloat(price),
      categoryId,
      stockQuantity: parseInt(stock), // ✅ Use stockQuantity (database field)
      sizes: sizes, // ✅ Don't stringify - PostgreSQL ARRAY handles it
      description: description || null,
      imageUrl: imageUrl || null,
    });

    console.log('✅ Product created:', newProduct.id);

    // Fetch the product with category info
    const productWithCategory = await productModel.findByPk(newProduct.id, {
      include: [
        {
          model: categoryModel,
          as: 'category',
          attributes: ['id', 'name']
        }
      ]
    });

    // ✅ Transform response to match frontend expectations
    const productData = productWithCategory.toJSON();
    const response = {
      ...productData,
      stock: productData.stockQuantity, // Map to stock
      Category: productData.category // Map to Category (capitalized)
    };

    res.status(201).json(response);
  } catch (error) {
    console.error('❌ Error creating product:', error);
    res.status(500).json({
      message: 'Error creating product',
      error: error.message,
    });
  }
});

// PUT /api/admin/products/:id - Update a product
router.put("/products/:id", async (req, res) => {
  try {
    console.log("📝 Updating product:", req.params.id);
    console.log("Request body:", req.body);

    const { name, price, categoryId, stock, sizes, description, imageUrl } = req.body;

    const dbModels = await models;
    const productModel = dbModels.Products;
    const categoryModel = dbModels.Category;

    const product = await productModel.findByPk(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Update the product
    await product.update({
      name,
      price: parseFloat(price),
      categoryId,
      stockQuantity: parseInt(stock), // ✅ Use stockQuantity (database field)
      sizes: sizes, // ✅ Don't stringify - PostgreSQL ARRAY handles it
      description: description || null,
      imageUrl: imageUrl || null,
    });

    console.log("✅ Product updated:", product.id);

    // Fetch updated product with category
    const updatedProduct = await productModel.findByPk(product.id, {
      include: [
        {
          model: categoryModel,
          as: "category",
          attributes: ["id", "name"],
        },
      ],
    });

    // ✅ Transform response to match frontend expectations
    const productData = updatedProduct.toJSON();
    const response = {
      ...productData,
      stock: productData.stockQuantity, // Map to stock
      Category: productData.category // Map to Category (capitalized)
    };

    res.json(response);
  } catch (error) {
    console.error("❌ Error updating product:", error);
    res.status(500).json({
      message: "Error updating product",
      error: error.message,
    });
  }
});

// DELETE /api/admin/products/:id - Delete a product  
router.delete("/products/:id", async (req, res) => {
  try {
    console.log('🗑️ Deleting product:', req.params.id);
    
    const dbModels = await models;
    const productModel = dbModels.Products;

    const product = await productModel.findByPk(req.params.id);
    
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    await product.destroy();

    console.log('✅ Product deleted:', req.params.id);

    res.json({
      message: "Product deleted successfully",
      id: req.params.id,
    });
  } catch (error) {
    console.error("❌ Error deleting product:", error);
    res.status(500).json({ 
      message: "Error deleting product", 
      error: error.message 
    });
  }
});
       






// Update order status
router.patch("/orders/:id/status", async (req, res) => {
  try {
    const dbModels = await models;
    const orderModel = dbModels.Orders;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ message: "Status is required" });
    }

    const validStatuses = [
      "pending",
      "processing",
      "shipped",
      "delivered",
      "cancelled",
    ];
    if (!validStatuses.includes(status.toLowerCase())) {
      return res.status(400).json({
        message:
          "Invalid status. Must be one of: pending, processing, shipped, delivered, cancelled",
      });
    }

    const order = await orderModel.findByPk(req.params.id);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    order.status = status.toLowerCase();
    await order.save();

    res.json({
      message: "Order status updated successfully",
      order,
    });
  } catch (error) {
    console.error("Error updating order status:", error);
    res.status(500).json({
      message: "Error updating order status",
      error: error.message,
    });
  }
});

// Update custom order status
router.patch("/custom-orders/:id/status", async (req, res) => {
  try {
    const dbModels = await models;
    const customOrderModel = dbModels.CustomOrder;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ message: "Status is required" });
    }

    const validStatuses = ["pending", "in_progress", "completed", "cancelled"];
    if (!validStatuses.includes(status.toLowerCase())) {
      return res.status(400).json({
        message:
          "Invalid status. Must be one of: pending, in_progress, completed, cancelled",
      });
    }

    const order = await customOrderModel.findByPk(req.params.id);

    if (!order) {
      return res.status(404).json({ message: "Custom order not found" });
    }

    order.status = status.toLowerCase();
    await order.save();

    res.json({
      message: "Custom order status updated successfully",
      order,
    });
  } catch (error) {
    console.error("Error updating custom order status:", error);
    res.status(500).json({
      message: "Error updating custom order status",
      error: error.message,
    });
  }
});


export default router;