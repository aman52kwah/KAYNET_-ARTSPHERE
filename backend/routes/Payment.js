import "dotenv/config";
import axios from "axios";
import express from "express";
import crypto from "crypto";
import { requireAuth } from "../middleware/auth.js";
import models from '../models/index.js';

const router = express.Router();

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
const PAYSTACK_BASE_URL = "https://api.paystack.co";

// Initialize payment for custom orders (50% deposit)
// Initialize payment for custom orders (50% deposit)
router.post("/initialize-custom-order", requireAuth, async (req, res) => {
  try {
    const dbModels = await models;
    const paymentModel = dbModels.Payment;
    const customOrderModel = dbModels.CustomOrder;
    const { customOrderId } = req.body;
    const customOrder = await customOrderModel.findByPk(customOrderId);

    if (!customOrder) {
      return res.status(404).json({ message: "Custom order not found" });
    }

    if (customOrder.userId !== req.user.id) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    // Calculate 50% deposit - ✅ CHANGED from totalPrice to totalAmount
    const depositAmount = (parseFloat(customOrder.totalAmount) * 0.5).toFixed(2);
    const amountInSubunits = Math.round(depositAmount * 100);

    // Initialize paystack transaction
    const response = await axios.post(
      `${PAYSTACK_BASE_URL}/transaction/initialize`,
      {
        email: req.user.email,
        amount: amountInSubunits,
        currency: 'GHS',
        metadata: {
          customOrderId: customOrder.id,
          userId: req.user.id,
          paymentType: "partial",
        },
        callback_url: `${process.env.CLIENT_URL}/payment/verify`,
      },
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    await paymentModel.create({
      customOrderId: customOrder.id,
      amount: depositAmount,
      transactionId: response.data.data.reference,
      paymentStatus: "pending",
      isDeposit: true,
      isFinalPayment: false,
      currency: 'GHS',
    });

    res.json({
      authorizationUrl: response.data.data.authorization_url,
      reference: response.data.data.reference,
    });
  } catch (error) {
    console.error(
      "Payment initialization error:",
      error.response?.data || error
    );
    res
      .status(500)
      .json({ message: "Failed to initialize payment", error: error.message });
  }
});

// Pay balance due for custom orders (after product is complete, before shipment)
// Pay balance due for custom orders (after product is complete, before shipment)
router.post("/initialize-balance-due", requireAuth, async (req, res) => {
  try {
    const dbModels = await models;
    const paymentModel = dbModels.Payment;
    const customOrderModel = dbModels.CustomOrder;
    const { customOrderId } = req.body;

    // ✅ Validate authentication first
    if (!req.user || !req.user.id) {
      return res.status(401).json({ 
        message: "Unauthorized - User not authenticated" 
      });
    }

    // ✅ Validate customOrderId
    if (!customOrderId) {
      return res.status(400).json({ 
        message: "Custom order ID is required" 
      });
    }

    // ✅ Fetch order
    const customOrder = await customOrderModel.findByPk(customOrderId);

    if (!customOrder) {
      return res.status(404).json({ 
        message: "Custom order not found" 
      });
    }

    if (customOrder.userId !== req.user.id) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    // Check if order is complete and awaiting final payment
    if (customOrder.status !== "completed") {
      return res.status(400).json({ 
        message: "Order must be marked as complete before balance payment" 
      });
    }

    // ✅ ADD DEBUGGING AND VALIDATION
    console.log('💰 ========== BALANCE PAYMENT DEBUG ==========');
    console.log('Custom Order ID:', customOrderId);
    console.log('Total Amount from DB:', customOrder.totalAmount); // ✅ Changed from totalPrice
    console.log('Total Amount type:', typeof customOrder.totalAmount);
    console.log('User email:', req.user.email);

    // ✅ FIX: Use totalAmount instead of totalPrice
    if (!customOrder.totalAmount || isNaN(parseFloat(customOrder.totalAmount))) {
      console.error('❌ Invalid totalAmount:', customOrder.totalAmount);
      return res.status(400).json({ 
        message: "Invalid order total amount" 
      });
    }

    // Calculate balance due (50% of total amount)
    const totalAmount = parseFloat(customOrder.totalAmount); // ✅ Changed from totalPrice
    const balanceDue = (totalAmount * 0.5).toFixed(2);
    const balanceDueNumber = parseFloat(balanceDue);
    
    // ✅ Validate balanceDue is positive
    if (balanceDueNumber <= 0) {
      console.error('❌ Invalid balance due:', balanceDueNumber);
      return res.status(400).json({ 
        message: "Invalid balance amount calculated" 
      });
    }

    // Convert to pesewas (smallest currency unit) - must be integer
    const amountInSubunits = Math.round(balanceDueNumber * 100);

    console.log('Balance Due (GHS):', balanceDue);
    console.log('Amount in pesewas:', amountInSubunits);
    console.log('Amount validation:', {
      isInteger: Number.isInteger(amountInSubunits),
      isPositive: amountInSubunits > 0,
      value: amountInSubunits
    });
    console.log('===============================================');

    // ✅ Final validation before sending to Paystack
    if (!Number.isInteger(amountInSubunits) || amountInSubunits <= 0) {
      console.error('❌ Invalid amount for Paystack:', amountInSubunits);
      return res.status(400).json({ 
        message: "Invalid payment amount calculated" 
      });
    }

    // Initialize paystack transaction
    const paystackPayload = {
      email: req.user.email,
      amount: amountInSubunits,
      currency: 'GHS',
      metadata: {
        customOrderId: customOrder.id,
        userId: req.user.id,
        paymentType: "balance",
      },
      callback_url: `${process.env.CLIENT_URL}/payment/verify`,
    };

    console.log('📤 Sending to Paystack:', paystackPayload);

    const response = await axios.post(
      `${PAYSTACK_BASE_URL}/transaction/initialize`,
      paystackPayload,
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log('✅ Paystack response:', response.data);

    // Create payment record for balance due
    await paymentModel.create({
      customOrderId: customOrder.id,
      amount: balanceDue,
      transactionId: response.data.data.reference,
      paymentStatus: "pending",
      isDeposit: false,
      isFinalPayment: true,
      currency: 'GHS',
    });

    res.json({
      authorizationUrl: response.data.data.authorization_url,
      reference: response.data.data.reference,
      balanceDue: balanceDue,
      message: "Balance payment initialized successfully",
    });
  } catch (error) {
    console.error("❌ Balance payment initialization error:", error.response?.data || error);
    res.status(500).json({ 
      message: "Failed to initialize balance payment", 
      error: error.response?.data || error.message 
    });
  }
});

// Initialize payment for ready-made order (full payment)
router.post("/initialize-order", requireAuth, async (req, res) => {
  try {
    const dbModels = await models;
    const orderModel = dbModels.Orders;
    const paymentModel = dbModels.Payment;
    const { orderId } = req.body;
    const order = await orderModel.findByPk(orderId);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.userId !== req.user.id) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    // DEBUG: Log the order details to see what's in the database
    console.log('💰 ========== PAYMENT INITIALIZATION DEBUG ==========');
    console.log('Order ID:', orderId);
    console.log('Order totalAmount from DB:', order.totalAmount);
    console.log('Order totalAmount type:', typeof order.totalAmount);
    console.log('User email:', req.user.email);
    
    const amountInSubunits = Math.round(parseFloat(order.totalAmount) * 100);  // Pesewas for GHS
    
    console.log('Amount in pesewas (for Paystack):', amountInSubunits);
    console.log('Amount in GHS (display):', amountInSubunits / 100);
    console.log('====================================================');

    // Initialize paystack transaction
    const response = await axios.post(
      `${PAYSTACK_BASE_URL}/transaction/initialize`,
      {
        email: req.user.email,
        amount: amountInSubunits,
        currency: 'GHS',
        metadata: {
          orderId: order.id,
          userId: req.user.id,
          paymentType: "full",
        },
        callback_url: `${process.env.CLIENT_URL}/payment/verify`,
      },
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log('✅ Paystack initialized successfully:', {
      authorization_url: response.data.data.authorization_url.substring(0, 50) + '...',
      reference: response.data.data.reference,
      amount_sent_to_paystack: amountInSubunits
    });

    // Create payment record
    await paymentModel.create({
      orderId: order.id,
      amount: order.totalAmount,
      transactionId: response.data.data.reference,
      paymentStatus: "pending",
      isDeposit: false,
      isFinalPayment: true,
      currency: 'GHS',
    });

    res.json({
      authorizationUrl: response.data.data.authorization_url,
      reference: response.data.data.reference,
    });
  } catch (error) {
    console.error('❌ Payment initialization error:', error.response?.data || error.message);
    res
      .status(500)
      .json({ message: "Failed to initialize payment", error: error.message });
  }
});


// Get balance due for a custom order
// Get balance due for a custom order
router.get("/balance-due/:customOrderId", requireAuth, async (req, res) => {
  try {
    const dbModels = await models;
    const customOrderModel = dbModels.CustomOrder;
    const paymentModel = dbModels.Payment;
    const { customOrderId } = req.params;

    // Check if user is authenticated
    if (!req.user || !req.user.id) {
      return res.status(401).json({ 
        message: 'User not authenticated' 
      });
    }

    const customOrder = await customOrderModel.findByPk(customOrderId);

    if (!customOrder) {
      return res.status(404).json({ message: "Custom order not found" });
    }

    if (customOrder.userId !== req.user.id) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    // Calculate amounts - ✅ CHANGED from totalPrice to totalAmount
    const depositAmount = (parseFloat(customOrder.totalAmount) * 0.5).toFixed(2);
    const balanceDue = (parseFloat(customOrder.totalAmount) * 0.5).toFixed(2);

    // Check if balance has already been paid
    const balancePayment = await paymentModel.findOne({
      where: {
        customOrderId: customOrderId,
        isFinalPayment: true,
        paymentStatus: "completed",
      },
    });

    res.json({
      customOrderId: customOrder.id,
      totalPrice: customOrder.totalAmount, // ✅ Return as totalPrice but read from totalAmount
      depositAmount: depositAmount,
      balanceDue: balanceDue,
      status: customOrder.status,
      isBalancePaid: !!balancePayment,
      paidAmount: customOrder.paidAmount || 0,
      readyForShipment: balancePayment ? true : false,
      message: balancePayment 
        ? "Balance payment completed. Order ready for shipment."
        : "Balance payment pending. Please complete payment before shipment.",
    });
  } catch (error) {
    console.error("Error getting balance due:", error);
    res.status(500).json({ 
      message: "Failed to get balance information", 
      error: error.message 
    });
  }
});

// Verify payment
router.get("/verify/:reference", async (req, res) => {
  try {
    const dbModels = await models;
    const customOrderModel = dbModels.CustomOrder;
    const orderModel = dbModels.Orders;
    const paymentModel = dbModels.Payment;
    const { reference } = req.params;

    // Verify transaction with paystack
    const response = await axios.get(
      `${PAYSTACK_BASE_URL}/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        },
      }
    );

    const { status, metadata, amount, channel } = response.data.data;  // FIX: Added channel destructuring

    if (status === "success") {
      // Update payment record
      const payment = await paymentModel.findOne({
        where: { transactionId: reference },
      });

      if (payment) {
        payment.paymentStatus = "completed";
        payment.paymentMethod = channel;  // Now defined; assumes it matches model ENUM (e.g., 'card')
        await payment.save();

        // Update order or custom order status
        if (metadata.customOrderId) {
          const customOrder = await customOrderModel.findByPk(
            metadata.customOrderId
          );
          if (customOrder) {
            customOrder.paidAmount =
              parseFloat(customOrder.paidAmount || 0) + amount / 100;
            customOrder.status = "confirmed";
            await customOrder.save();
          }
        } else if (metadata.orderId) {
          const order = await orderModel.findByPk(metadata.orderId);
          if (order) {
            order.status = "paid";
            await order.save();
          }
        }
      }

      res.json({
        success: true,
        message: "Payment verified successfully",
        data: response.data.data,
      });
    } else {
      res.status(400).json({
        success: false,
        message: "Payment verification failed",
      });
    }
  } catch (error) {
    console.error("Payment verification error:", error.response?.data || error);
    res
      .status(500)
      .json({ message: "Failed to verify payment", error: error.message });
  }
});

// Paystack webhook for payment notification
router.post("/webhook", async (req, res) => {
  try {
    const dbModels = await models;
    const paymentModel = dbModels.Payment;
    const customOrderModel = dbModels.CustomOrder;
    const orderModel = dbModels.Orders;
    const hash = crypto
      .createHmac("sha512", PAYSTACK_SECRET_KEY)
      .update(JSON.stringify(req.body))
      .digest("hex");

    if (hash === req.headers["x-paystack-signature"]) {
      const event = req.body;

      if (event.event === "charge.success") {
        const { reference, metadata, amount, channel } = event.data;

        const payment = await paymentModel.findOne({
          where: { transactionId: reference },
        });

        if (payment && payment.paymentStatus === "pending") {
          payment.paymentStatus = "completed";  // FIX: Use paymentStatus and 'completed' to match model ENUM
          payment.paymentMethod = channel;
          await payment.save();

          // Update related order/custom order
          if (metadata.customOrderId) {
            const customOrder = await customOrderModel.findByPk(
              metadata.customOrderId
            );
            if (customOrder) {
              customOrder.paidAmount =
                parseFloat(customOrder.paidAmount || 0) + amount / 100;
              customOrder.status = "confirmed";
              await customOrder.save();
            }
          } else if (metadata.orderId) {
            const order = await orderModel.findByPk(metadata.orderId);
            if (order) {
              order.status = "paid";
              await order.save();
            }
          }
        }
      }
    }
    res.sendStatus(200);
  } catch (error) {
    console.error("Webhook error:", error);
    res.sendStatus(500);
  }
});

// Get user payment history
router.get("/history", requireAuth, async (req, res) => {
  try {
    const { Op } = Sequelize;
    const dbModels = await models;
    const paymentModel = dbModels.Payment;
    const payments = await paymentModel.findAll({
      include: [
        { model: dbModels.Orders },
        { model: dbModels.CustomOrder },
      ],
      where: {
        [Op.or]: [
          { '$Orders.userId$': req.user.id },
          { '$CustomOrder.userId$': req.user.id },
        ]
      },
      order: [["createdAt", "DESC"]],
    });
    res.json(payments);
  } catch (error) {
    console.error("Error fetching payment history:", error);
    res.status(500).json({ message: "Failed to fetch payment history" });
  }
});

 export default router;