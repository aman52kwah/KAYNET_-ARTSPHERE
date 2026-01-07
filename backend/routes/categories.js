import 'dotenv/config';
import express from 'express';
import models from '../models/index.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const dbModels = await models;
    const CategoryModel = dbModels.Category;
    
    const categories = await CategoryModel.findAll();
    
    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ message: 'Error fetching categories', error: error.message });
  }
});

export default router;