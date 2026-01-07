// routes/orders.js - ADD THESE ENDPOINTS TO YOUR EXISTING ORDERS ROUTE FILE

import express from "express";
import models from "../models/index.js";

const router = express.Router();

// Middleware to check if user is authenticated
const isAuthenticated = (req, res, next) => {
  if (!req.session || !req.session.user) {
    return res
      .status(401)
      .json({ message: "Unauthorized - Please login first" });
  }
  req.user = req.session.user;
  next();
};


// Add this to your routes/orders.js file

// POST /api/orders - Create a new order
router.post('/', isAuthenticated, async (req, res) => {
  try {
    console.log('📦 Creating new order for user:', req.user.id);
    console.log('Order data:', req.body);

    const dbModels = await models;
    const orderModel = dbModels.Orders;
    const orderItemsModel = dbModels.OrderItems;
    const productModel = dbModels.Products;

    const { items, shippingAddress } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Order must contain at least one item' });
    }

    if (!shippingAddress) {
      return res.status(400).json({ message: 'Shipping address is required' });
    }

    // Calculate total amount
    let totalAmount = 0;
    const productDetails = [];

    for (const item of items) {
      const product = await productModel.findByPk(item.productId);
      
      if (!product) {
        return res.status(404).json({ 
          message: `Product with ID ${item.productId} not found` 
        });
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({ 
          message: `Insufficient stock for ${product.name}. Available: ${product.stock}` 
        });
      }

      const itemTotal = parseFloat(product.price) * item.quantity;
      totalAmount += itemTotal;

      productDetails.push({
        productId: product.id,
        quantity: item.quantity,
        price: product.price,
        product: product
      });
    }

    // Generate order number
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Create order
    const order = await orderModel.create({
      userId: req.user.id,
      orderNumber: orderNumber,
      totalAmount: totalAmount,
      status: 'pending',
      shippingAddress: shippingAddress,
      paymentStatus: 'pending'
    });

    // Create order items
    for (const detail of productDetails) {
      await orderItemsModel.create({
        orderId: order.id,
        productId: detail.productId,
        quantity: detail.quantity,
        price: detail.price
      });

      // Update product stock
      await productModel.update(
        { stock: detail.product.stock - detail.quantity },
        { where: { id: detail.productId } }
      );
    }

    // Fetch complete order with items
    const completeOrder = await orderModel.findByPk(order.id, {
      include: [
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
      ]
    });

    console.log('✅ Order created successfully:', completeOrder.id);

    res.status(201).json(completeOrder);
  } catch (error) {
    console.error('❌ Error creating order:', error);
    res.status(500).json({
      message: 'Error creating order',
      error: error.message
    });
  }
});

// GET /api/orders - Get current user's orders
router.get("/", isAuthenticated, async (req, res) => {
  try {
    console.log("📦 Fetching orders for user:", req.user.id);
    const dbModels = await models;
    const orderModel = dbModels.Orders;
    const orderItemsModel = dbModels.OrderItems;
    const productModel = dbModels.Products;

    const orders = await orderModel.findAll({
      where: { userId: req.user.id },
      include: [
        {
          model: orderItemsModel,
          as: "OrderItems",
          include: [
            {
              model: productModel,
              as: "Products",
              attributes: ["name", "imageUrl", "price"],
            },
          ],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    console.log(`✅ Found ${orders.length} orders for user ${req.user.id}`);
    res.json(orders);
  } catch (error) {
    console.error("❌ Error fetching user orders:", error);
    res.status(500).json({
      message: "Error fetching orders",
      error: error.message,
    });
  }
});

// GET /api/orders/:id - Get specific order by ID
router.get("/:id", isAuthenticated, async (req, res) => {
  try {
    const dbModels = await models;
    const orderModel = dbModels.Orders;
    const orderItemsModel = dbModels.OrderItems;
    const productModel = dbModels.Products;

    const order = await orderModel.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id, // Ensure user can only see their own orders
      },
      include: [
        {
          model: orderItemsModel,
          as: "OrderItems",
          include: [
            {
              model: productModel,
              as: "Products",
            },
          ],
        },
      ],
    });

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.json(order);
  } catch (error) {
    console.error("Error fetching order:", error);
    res.status(500).json({
      message: "Error fetching order",
      error: error.message,
    });
  }
});

export default router;
