// import "dotenv/config";
// import axios from "axios";
// import express from "express";
// import crypto from "crypto";
// import { requireAuth } from "../middleware/auth.js";
// import { models } from "../models/index.js";

// const router = express.Router();

// const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
// const PAYSTACK_BASE_URL = "https://api.paystack.co";

// // Initialize payment for custom orders (50% deposit)
// router.post("/initialize-custom-order", requireAuth, async (req, res) => {
//   try {
//     const db = await models;
//     const paymentModel = db.Payment;
//     const customOrderModel = db.CustomOrder;
//     const { customOrderId } = req.body;
//     const customOrder = await customOrderModel.findByPk(customOrderId);

//     if (!customOrder) {
//       return res.status(404).json({ message: "Custom order not found" });
//     }

//     // FIX: Changed customOrderId.userId to customOrder.userId
//     if (customOrder.userId !== req.user.id) {
//       return res.status(403).json({ message: "Unauthorized" });
//     }

//     // Calculate 50% deposit
//     const depositAmount = (parseFloat(customOrder.totalPrice) * 0.5).toFixed(2);
//     const amountInKobo = Math.round(depositAmount * 100);

//     // Initialize paystack transaction
//     const response = await axios.post(
//       `${PAYSTACK_BASE_URL}/transaction/initialize`,
//       {
//         email: req.user.email,
//         amount: amountInKobo,
//         metadata: {
//           customOrderId: customOrder.id,
//           userId: req.user.id,
//           paymentType: "partial",
//         },
//         callback_url: `${process.env.CLIENT_URL}/payment/verify`, // FIX: Changed comma to slash
//       },
//       {
//         headers: {
//           Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
//           "Content-Type": "application/json",
//         },
//       }
//     );

//     await paymentModel.create({
//       customOrderId: customOrder.id,
//       amount: depositAmount,
//       transactionId: response.data.data.reference,
//       paymentStatus: "pending",
//       isDeposit:true,
//       isFinalPayment:false,
//       currency:'GHC',
//     });

//     res.json({
//       authorizationUrl: response.data.data.authorization_url,
//       reference: response.data.data.reference,
//     });
//   } catch (error) {
//     console.error(
//       "Payment initialization error:",
//       error.response?.data || error
//     );
//     res
//       .status(500)
//       .json({ message: "Failed to initialize payment", error: error.message });
//   }
// });

// // Initialize payment for ready-made order (full payment)
// router.post("/initialize-order", requireAuth, async (req, res) => {
//   try {
//     const db = await models;
//     const orderModel = db.Orders;
//     const paymentModel = db.Payment;
//     const { orderId } = req.body;
//     const order = await orderModel.findByPk(orderId);

//     if (!order) {
//       return res.status(404).json({ message: "Order not found" });
//     }

//     if (order.userId !== req.user.id) {
//       return res.status(403).json({ message: "Unauthorized" });
//     }

//     const amountInKobo = Math.round(parseFloat(order.totalAmount) * 100);

//     // Initialize paystack transaction
//     const response = await axios.post(
//       `${PAYSTACK_BASE_URL}/transaction/initialize`,
//       {
//         email: req.user.email,
//         amount: amountInKobo,
//         metadata: {
//           orderId: order.id,
//           userId: req.user.id,
//           paymentType: "full",
//         },
//         callback_url: `${process.env.CLIENT_URL}/payment/verify`,
//       },
//       {
//         headers: {
//           Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
//           "Content-Type": "application/json",
//         },
//       }
//     );

//     // Create payment record
//     await paymentModel.create({
//       orderId: order.id,
//       amount: order.totalAmount,
//       transactionId: response.data.data.reference,
//       paymentStatus: "pending",
//       isDeposit:false,
//       isFinalPayment:true,
//       currency:'GHC',
//     });

//     res.json({
//       authorizationUrl: response.data.data.authorization_url, // FIX: Changed reference to response
//       reference: response.data.data.reference, // FIX: Fixed property access
//     });
//   } catch (error) {
//     console.error(
//       "Payment initialization error:",
//       error.response?.data || error
//     );
//     res
//       .status(500)
//       .json({ message: "Failed to initialize payment", error: error.message });
//   }
// });

// // Verify payment
// router.get("/verify/:reference", async (req, res) => {
//   try {
//     const db = await models;
//     const customOrderModel = db.CustomOrder;
//     const orderModel = db.Orders;
//     const paymentModel = db.Payment;
//     const { reference } = req.params;

//     // Verify transaction with paystack
//     const response = await axios.get(
//       `${PAYSTACK_BASE_URL}/transaction/verify/${reference}`,
//       {
//         headers: {
//           Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
//         },
//       }
//     );

//     const { status, metadata, amount } = response.data.data;

//     if (status === "success") {
//       // Update payment record
//       const payment = await paymentModel.findOne({
//         where: { transactionId: reference },
//       });

//       if (payment) {
//         payment.paymentStatus = "completed";
//         payment.paymentMethod = channel;
//         await payment.save(); // FIX: Changed Payment.save() to payment.save()

//         // Update order or custom order status
//         if (metadata.customOrderId) {
//           const customOrder = await customOrderModel.findByPk(
//             metadata.customOrderId
//           );
//           if (customOrder) {
//             customOrder.paidAmount =
//               parseFloat(customOrder.paidAmount || 0) + amount / 100;
//             customOrder.status = "confirmed";
//             await customOrder.save();
//           }
//         } else if (metadata.orderId) {
//           const order = await orderModel.findByPk(metadata.orderId);
//           if (order) {
//             order.status = "paid";
//             await order.save();
//           }
//         }
//       }

//       res.json({
//         success: true,
//         message: "Payment verified successfully",
//         data: response.data.data,
//       });
//     } else {
//       res.status(400).json({
//         // FIX: Changed 404 to 400
//         success: false,
//         message: "Payment verification failed",
//       });
//     }
//   } catch (error) {
//     console.error("Payment verification error:", error.response?.data || error);
//     res
//       .status(500)
//       .json({ message: "Failed to verify payment", error: error.message });
//   }
// });

// // Paystack webhook for payment notification
// router.post("/webhook", async (req, res) => {
//   try {
//     const db = await models;
//     const paymentModel = db.Payment;
//     const customOrderModel = db.CustomOrder;
//     const orderModel = db.Orders;
//     const hash = crypto
//       .createHmac("sha512", PAYSTACK_SECRET_KEY)
//       .update(JSON.stringify(req.body))
//       .digest("hex");

//     if (hash === req.headers["x-paystack-signature"]) {
//       const event = req.body;

//       if (event.event === "charge.success") {
//         const { reference, metadata, amount,channel } = event.data;

//         const payment = await paymentModel.findOne({
//           where: { transactionId: reference },
//         });

//         if (payment && payment.paymentStatus === "pending") {
//           payment.status = "success";
//           payment.paymentMethod = channel;
//           await payment.save(); // FIX: Changed Payment.save() to payment.save()

//           // Update related order/custom order
//           if (metadata.customOrderId) {
//             const customOrder = await customOrderModel.findByPk(
//               metadata.customOrderId
//             );
//             if (customOrder) {
//               customOrder.paidAmount =
//                 parseFloat(customOrder.paidAmount || 0) + amount / 100;
//               customOrder.status = "confirmed";
//               await customOrder.save();
//             }
//           } else if (metadata.orderId) {
//             const order = await orderModel.findByPk(metadata.orderId);
//             if (order) {
//               order.status = "paid";
//               await order.save();
//             }
//           }
//         }
//       }
//     }
//     res.sendStatus(200);
//   } catch (error) {
//     console.error("Webhook error:", error);
//     res.sendStatus(500);
//   }
// });

// // Get user payment history
// router.get("/history", requireAuth, async (req, res) => {
//   try {
//     const db = await models;
//     const { Op } = db.Sequelize;
//     const paymentModel = db.Payment;
//     const payments = await paymentModel.findAll({
//       include: [
//         { model: db.Orders},
//         { model: db.CustomOrder},
//       ],
//       where:{
//         [Op.or]:[
//           { '$Orders.userId$': req.user.id },
//           { '$CustomOrder.userId$': req.user.id },
//         ]
//       },
//       order: [["createdAt", "DESC"]],
//     });
//     res.json(payments);
//   } catch (error) {
//     console.error("Error fetching payment history:", error);
//     res.status(500).json({ message: "Failed to fetch payment history" });
//   }
// });

// export default router;
import "dotenv/config";
import axios from "axios";
import express from "express";
import crypto from "crypto";
import { requireAuth } from "../middleware/auth.js";
import db from '../models/index.js';

const router = express.Router();

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
const PAYSTACK_BASE_URL = "https://api.paystack.co";

// Initialize payment for custom orders (50% deposit)
router.post("/initialize-custom-order", requireAuth, async (req, res) => {
  try {
    
    const paymentModel = db.Payment;
    const customOrderModel = db.CustomOrder;
    const { customOrderId } = req.body;
    const customOrder = await customOrderModel.findByPk(customOrderId);

    if (!customOrder) {
      return res.status(404).json({ message: "Custom order not found" });
    }

    if (customOrder.userId !== req.user.id) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    // Calculate 50% deposit
    const depositAmount = (parseFloat(customOrder.totalPrice) * 0.5).toFixed(2);
    const amountInSubunits = Math.round(depositAmount * 100);  // Pesewas for GHS

    // Initialize paystack transaction
    const response = await axios.post(
      `${PAYSTACK_BASE_URL}/transaction/initialize`,
      {
        email: req.user.email,
        amount: amountInSubunits,
        currency: 'GHS',  // FIX: Explicitly set to match model default and ensure pesewas
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
      currency: 'GHS',  // FIX: Corrected from 'GHC' to standard 'GHS'
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

// Initialize payment for ready-made order (full payment)
router.post("/initialize-order", requireAuth, async (req, res) => {
  try {
    
    const orderModel = db.Orders;
    const paymentModel = db.Payment;
    const { orderId } = req.body;
    const order = await orderModel.findByPk(orderId);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.userId !== req.user.id) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const amountInSubunits = Math.round(parseFloat(order.totalAmount) * 100);  // Pesewas for GHS

    // Initialize paystack transaction
    const response = await axios.post(
      `${PAYSTACK_BASE_URL}/transaction/initialize`,
      {
        email: req.user.email,
        amount: amountInSubunits,
        currency: 'GHS',  // FIX: Explicitly set
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

    // Create payment record
    await paymentModel.create({
      orderId: order.id,
      amount: order.totalAmount,
      transactionId: response.data.data.reference,
      paymentStatus: "pending",
      isDeposit: false,
      isFinalPayment: true,
      currency: 'GHS',  // FIX: Corrected from 'GHC'
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

// Verify payment
router.get("/verify/:reference", async (req, res) => {
  try {
    
    const customOrderModel = db.CustomOrder;
    const orderModel = db.Orders;
    const paymentModel = db.Payment;
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
  
    const paymentModel = db.Payment;
    const customOrderModel = db.CustomOrder;
    const orderModel = db.Orders;
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
    const { Op } = db.Sequelize;
    const paymentModel = db.Payment;
    const payments = await paymentModel.findAll({
      include: [
        { model: db.Orders },
        { model: db.CustomOrder },
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