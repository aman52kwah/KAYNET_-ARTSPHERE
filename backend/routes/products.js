import 'dotenv/config';
import express from 'express';
const router = express.Router();
import { Op } from 'sequelize';
import models from '../models/index.js';

// Get all products
router.get('/', async (req, res) => {
  try {
    // Await the models promise
    const dbModels = await models;
    const ProductModel = dbModels.Products;
    const CategoryModel = dbModels.Category;

    const { category, search } = req.query;
    const where = {};

    if (category) where.categoryId = category;
    if (search) {
      where.name = { [Op.iLike]: `%${search}%` };
    }

    const products = await ProductModel.findAll({
      where,
      include: [{ model: CategoryModel, as: 'category' }],
    });

    res.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ message: 'Error fetching products', error: error.message });
  }
});

// Get single product
router.get('/:id', async (req, res) => {
  try {
    // Await the models promise
    const dbModels = await models;
    const ProductModel = dbModels.Products;
    const CategoryModel = dbModels.Category;

    const product = await ProductModel.findByPk(req.params.id, {
      include: [{ model: CategoryModel, as: 'category' }],
    });

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json(product);
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ message: 'Error fetching product', error: error.message });
  }
});

export default router;