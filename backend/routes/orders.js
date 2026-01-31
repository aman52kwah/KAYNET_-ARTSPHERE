// routes/orders.js - FIXED VERSION
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

// POST /api/orders - Create a new order
router.post('/', isAuthenticated, async (req, res) => {
  try {
    console.log('📦 ========== CREATE ORDER DEBUG ==========');
    console.log('User ID:', req.user.id);
    console.log('Request body:', JSON.stringify(req.body, null, 2));

    const dbModels = await models;
    const orderModel = dbModels.Orders;
    const orderItemsModel = dbModels.OrderItems;
    const productModel = dbModels.Products;

    const { items, shippingAddress, totalAmount } = req.body;

    // Validation
    if (!items || !Array.isArray(items) || items.length === 0) {
      console.error('❌ Invalid items');
      return res.status(400).json({ message: 'Order must contain at least one item' });
    }

    if (!shippingAddress) {
      console.error('❌ Missing shipping address');
      return res.status(400).json({ message: 'Shipping address is required' });
    }

    // Calculate items subtotal
    let itemsSubtotal = 0;
    const productDetails = [];

    console.log('🔍 Processing', items.length, 'items...');

    for (const item of items) {
      console.log('Processing item:', item);

      if (!item.productId) {
        console.error('❌ Missing productId in item');
        return res.status(400).json({ message: 'Each item must have a productId' });
      }

      const product = await productModel.findByPk(item.productId);
      
      if (!product) {
        console.error('❌ Product not found:', item.productId);
        return res.status(404).json({ 
          message: `Product with ID ${item.productId} not found` 
        });
      }

      // Check stock (use stockQuantity from your model)
      const availableStock = product.stockQuantity || product.stock || 0;
      if (availableStock < item.quantity) {
        console.error('❌ Insufficient stock for product:', product.id);
        return res.status(400).json({ 
          message: `Insufficient stock for ${product.name}. Available: ${availableStock}` 
        });
      }

      const itemPrice = parseFloat(product.price);
      const itemQuantity = parseInt(item.quantity) || 1;
      const itemTotal = itemPrice * itemQuantity;
      
      itemsSubtotal += itemTotal;

      productDetails.push({
        productId: product.id,
        quantity: itemQuantity,
        price: itemPrice,
        product: product,
      });

      console.log('✅ Item processed:', {
        name: product.name,
        price: itemPrice,
        quantity: itemQuantity,
        subtotal: itemTotal
      });
    }

    // Calculate financial breakdown
    const shippingCost = 20; // Fixed GH₵ 20
    const taxRate = 0.10; // 10% tax
    const taxAmount = Math.round((itemsSubtotal * taxRate) * 100) / 100;
    const grandTotal = Math.round((itemsSubtotal + shippingCost + taxAmount) * 100) / 100;

    console.log('💰 Financial breakdown:', {
      itemsSubtotal,
      shippingCost,
      taxAmount,
      grandTotal,
      providedTotal: totalAmount
    });

    // Use the provided totalAmount from frontend (which includes tax + shipping)
    const finalAmount = totalAmount ? parseFloat(totalAmount) : grandTotal;

    // Generate order number
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    console.log('📝 Creating order with number:', orderNumber);

    // Create order
    const order = await orderModel.create({
      userId: req.user.id,
      orderNumber: orderNumber,
      totalAmount: finalAmount,
      status: 'pending',
      shippingAddress: shippingAddress,
      paymentStatus: 'pending'
    });

    console.log('✅ Order created:', order.id);

    // Create order items and update stock
    for (const detail of productDetails) {
      await orderItemsModel.create({
        orderId: order.id,
        productId: detail.productId,
        quantity: detail.quantity,
        price: detail.price
      });

      console.log('✅ Order item created for product:', detail.productId);

      // Update product stock
      const currentStock = detail.product.stockQuantity || detail.product.stock || 0;
      const newStock = currentStock - detail.quantity;

      await productModel.update(
        { stockQuantity: newStock },
        { where: { id: detail.productId } }
      );

      console.log('✅ Stock updated for product:', detail.productId, '- New stock:', newStock);
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

    console.log('✅ Order created successfully with', productDetails.length, 'items');
    console.log('===========================================');

    res.status(201).json(completeOrder);
  } catch (error) {
    console.error('❌ ========== CREATE ORDER ERROR ==========');
    console.error('Error:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('===========================================');
    
    res.status(500).json({
      message: 'Error creating order',
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
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