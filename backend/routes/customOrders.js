// routes/customOrders.js - ADD THESE ENDPOINTS TO YOUR EXISTING CUSTOM ORDERS ROUTE FILE

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
        },
        {
          model: materialModel,
          as: "Material",
          //attributes: ["name", "type", "pricePerUnit"],
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

    const customOrder = await customOrderModel.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id, // Ensure user can only see their own orders
      },
      include: [
        {
          model: styleModel,
          as: "Style",
        },
        {
          model: materialModel,
          as: "Material",
        },
      ],
    });

    if (!customOrder) {
      return res.status(404).json({ message: "Custom order not found" });
    }

    res.json(customOrder);
  } catch (error) {
    console.error("Error fetching custom order:", error);
    res.status(500).json({
      message: "Error fetching custom order",
      error: error.message,
    });
  }
});

export default router;
