
import 'dotenv/config';
import express from 'express';
const router = express.Router();
import { Op } from 'sequelize';
import db from '../models/index.js';  // Import the promise that resolves to all models

// Get all products
router.get('/', async (req, res) => {
  try {
      // Await the promise first to get the models object
    const ProductModel =  db.Products;
    const CategoryModel = db.Category;

    const { category, search } = req.query;
    const where = {};

    if (category) where.categoryId = category;
    if (search) {
      where.name = { [Op.iLike]: `%${search}%` };
    }

    const products = await ProductModel.findAll({
      where,
      include: [{model:CategoryModel,as:'category'}],
    });

    res.json(products);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching products', error: error.message });
  }
});

// Get single product
router.get('/:id', async (req, res) => {
  try {
     // Await the promise first (note: fixed from modelsPromise to models)
    const ProductModel = db.Products;
    const CategoryModel = db.Category;

    const product = await ProductModel.findByPk(req.params.id, {
      include: [{model:CategoryModel, as:'category'}],
    });
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching product', error: error.message });
  }
});

export default router;
