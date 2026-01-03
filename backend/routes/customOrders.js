import "dotenv/config";
import express from "express";
import db from '../models/index.js';

const router = express.Router();

//create customer order
// Create custom order
router.post("/", async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res
        .status(401)
        .json({ message: "Unauthorized - Please login first" });
    }
   
    const styleModel = db.Style;
    const materialModel = db.Material;
    const CustomOrderModel = db.CustomOrder;

    const { styleId, materialId, size, measurements, specialInstructions } =
      req.body;

    const style = await styleModel.findByPk(styleId);
    const material = await materialModel.findByPk(materialId);

    if (!style || !material) {
      return res.status(404).json({ message: "Style or material not found" });
    }

    const materialCost = parseFloat(material.pricePerMeter) * 2; // Assuming 2 meters
    const totalPrice = parseFloat(style.basePrice) + materialCost;

    const customOrder = await CustomOrderModel.create({
      userId: req.user.id,
      styleId,
      materialId,
      size,
      measurements: measurements || {},
      specialInstructions,
      totalPrice: totalPrice.toFixed(2),
      status: "pending",
    });

    res.status(201).json(customOrder);
  } catch (error) {
    console.error("Error creating custom order:", error);
    res
      .status(500)
      .json({ message: "Error creating custom order", error: error.message });
  }
});

// Get user's custom orders
router.get("/", async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res
        .status(401)
        .json({ message: "Unauthorized - Please login first" });
    }
    
    const customOrderModel = db.CustomOrder;
    const styleModel = db.Style;
    const materialModel = db.Material;

    const orders = await customOrderModel.findAll({
      where: { userId: req.user.id },
      include: [{ model: styleModel,as:'style' }, { model: materialModel, as:'material' }],
      order: [["createdAt", "DESC"]],
    });

    res.json(orders);
  } catch (error) {
    console.error("Error fetching custom orders:", error);
    res
      .status(500)
      .json({ message: "Error fetching custom orders", error: error.message });
  }
});

// Get single custom order
router.get("/:id", async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res
        .status(401)
        .json({ message: "Unauthorized - Please login first" });
    }
    
    const CustomOrderModel = db.CustomOrder;
    const styleModel = db.Style;
    const materialModel = db.Material;

    const order = await CustomOrderModel.findOne({
      where: { id: req.params.id, userId: req.user.id },
      include: [{ model: styleModel,as:'style' }, { model: materialModel,as:'materials' }],
    });

    if (!order) {
      return res.status(404).json({ message: "Custom order not found" });
    }

    res.json(order);
  } catch (error) {
    console.error("Error fetching custom order:", error);
    res
      .status(500)
      .json({ message: "Error fetching custom order", error: error.message });
  }
});

export default router;
