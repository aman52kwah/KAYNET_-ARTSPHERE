// routes/customOrders.js - UPDATED WITH CHECKOUT SUPPORT

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

// POST /api/custom-orders - Create a new custom order from checkout
router.post("/", isAuthenticated, async (req, res) => {
  try {
    console.log("🎨 Creating new custom order for user:", req.user.id);
    console.log("📦 Request body:", req.body);

    const dbModels = await models;
    const customOrderModel = dbModels.CustomOrder;
    const orderModel = dbModels.Orders;

    const { customOrderDetails, shippingAddress, totalAmount, depositAmount } = req.body;

    // Validate required fields
    if (!customOrderDetails || !shippingAddress || !totalAmount) {
      return res.status(400).json({
        message: "Missing required fields: customOrderDetails, shippingAddress, or totalAmount"
      });
    }

    // Create the custom order record
    const customOrder = await customOrderModel.create({
      userId: req.user.id,
      
      // Personal Info
      fullName: customOrderDetails.fullName,
      email: customOrderDetails.email,
      phone: customOrderDetails.phone,
      
      // Style Selection
      garmentType: customOrderDetails.garmentType,
      garmentLabel: customOrderDetails.garmentLabel,
      style: customOrderDetails.style,
      occasion: customOrderDetails.occasion,
      
      // Measurements
      measurements: JSON.stringify({
        bust: customOrderDetails.bust,
        waist: customOrderDetails.waist,
        hips: customOrderDetails.hips,
        shoulder: customOrderDetails.shoulder,
        sleeves: customOrderDetails.sleeves,
        length: customOrderDetails.length,
      }),
      
      // Material & Design
      fabricType: customOrderDetails.fabricType,
      fabricLabel: customOrderDetails.fabricLabel,
      fabricColor: customOrderDetails.fabricColor,
      designDetails: customOrderDetails.designDetails,
      
      // Additional Info
      urgency: customOrderDetails.urgency,
      urgencyLabel: customOrderDetails.urgencyLabel,
      specialRequests: customOrderDetails.specialRequests,
      
      // Pricing
      totalAmount: totalAmount,
      depositAmount: depositAmount || (totalAmount * 0.5),
      balanceAmount: totalAmount - (depositAmount || (totalAmount * 0.5)),
      
      // Shipping
      shippingAddress: shippingAddress,
      
      // Status
      status: 'pending', // pending, in_progress, completed, cancelled
      paymentStatus: 'deposit_pending', // deposit_pending, deposit_paid, fully_paid
    });

    // Generate order number for custom order
    const orderNumber = `CO-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    
    // Also create a regular Order record for tracking and payment
    const order = await orderModel.create({
      userId: req.user.id,
      orderNumber: orderNumber, // Add order number
      totalAmount: depositAmount || (totalAmount * 0.5), // Only charge deposit initially
      status: 'pending',
      paymentStatus: 'pending',
      shippingAddress: shippingAddress,
      orderType: 'custom', // Mark as custom order
      customOrderId: customOrder.id, // Link to custom order
    });

    console.log("✅ Custom order created successfully:", customOrder.id);
    console.log("✅ Order record created:", order.id);

    // Return the order with custom order details
    res.status(201).json({
      id: order.id,
      customOrderId: customOrder.id,
      totalAmount: totalAmount,
      depositAmount: depositAmount || (totalAmount * 0.5),
      balanceAmount: totalAmount - (depositAmount || (totalAmount * 0.5)),
      status: 'pending',
      orderType: 'custom',
      customOrder: customOrder,
    });

  } catch (error) {
    console.error("❌ Error creating custom order:", error);
    res.status(500).json({
      message: "Error creating custom order",
      error: error.message,
    });
  }
});

// GET /api/custom-orders - Get current user's custom orders
router.get("/", isAuthenticated, async (req, res) => {
  try {
    console.log("🎨 Fetching custom orders for user:", req.user.id);
    const dbModels = await models;
    const customOrderModel = dbModels.CustomOrder;
    const styleModel = dbModels.Style;
    const materialModel = dbModels.Material;

    const customOrders = await customOrderModel.findAll({
      where: { userId: req.user.id },
      include: [
        {
          model: styleModel,
          as: "Style",
          attributes: ["name", "imageUrl", "description"],
          required: false, // Make it optional since custom orders might not have styleId
        },
        {
          model: materialModel,
          as: "Material",
          required: false, // Make it optional
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    console.log(
      `✅ Found ${customOrders.length} custom orders for user ${req.user.id}`
    );
    res.json(customOrders);
  } catch (error) {
    console.error("❌ Error fetching user custom orders:", error);
    res.status(500).json({
      message: "Error fetching custom orders",
      error: error.message,
    });
  }
});

// GET /api/custom-orders/:id - Get specific custom order by ID
router.get("/:id", isAuthenticated, async (req, res) => {
  try {
    const dbModels = await models;
    const customOrderModel = dbModels.CustomOrder;
    const styleModel = dbModels.Style;
    const materialModel = dbModels.Material;
    const orderModel = dbModels.Orders;

    const customOrder = await customOrderModel.findOne({
      where: {
        id: req.params.id,
        //userId: req.user.id, // Ensure user can only see their own orders
      },
      include: [
        {
          model: styleModel,
          as: "Style",
          required: false,
        },
        {
          model: materialModel,
          as: "Material",
          required: false,
        },
      ],
    });

    if (!customOrder) {
      return res.status(404).json({ message: "Custom order not found" });
    }

    // Also fetch the associated order for payment status
    const order = await orderModel.findOne({
      where: {
        customOrderId: customOrder.id,
      },
    });

    res.json({
      ...customOrder.toJSON(),
      order: order,
    });
  } catch (error) {
    console.error("Error fetching custom order:", error);
    res.status(500).json({
      message: "Error fetching custom order",
      error: error.message,
    });
  }
});

// PATCH /api/custom-orders/:id/status - Update custom order status (for admin)
router.patch("/:id/status", isAuthenticated, async (req, res) => {
  try {
    const dbModels = await models;
    const customOrderModel = dbModels.CustomOrder;
    const { status } = req.body;

    // Optional: Add admin check here
    // if (req.user.role !== 'admin') {
    //   return res.status(403).json({ message: "Forbidden - Admin only" });
    // }

    const customOrder = await customOrderModel.findByPk(req.params.id);

    if (!customOrder) {
      return res.status(404).json({ message: "Custom order not found" });
    }

    customOrder.status = status;
    await customOrder.save();

    console.log(`✅ Updated custom order ${req.params.id} status to ${status}`);
    res.json(customOrder);
  } catch (error) {
    console.error("Error updating custom order status:", error);
    res.status(500).json({
      message: "Error updating custom order status",
      error: error.message,
    });
  }
});

// PATCH /api/custom-orders/:id/payment - Update payment status
router.patch("/:id/payment", isAuthenticated, async (req, res) => {
  try {
    const dbModels = await models;
    const customOrderModel = dbModels.CustomOrder;
    const { paymentStatus } = req.body;

    const customOrder = await customOrderModel.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id,
      },
    });

    if (!customOrder) {
      return res.status(404).json({ message: "Custom order not found" });
    }

    customOrder.paymentStatus = paymentStatus;
    await customOrder.save();

    console.log(`✅ Updated custom order ${req.params.id} payment status to ${paymentStatus}`);
    res.json(customOrder);
  } catch (error) {
    console.error("Error updating payment status:", error);
    res.status(500).json({
      message: "Error updating payment status",
      error: error.message,
    });
  }
});

export default router;