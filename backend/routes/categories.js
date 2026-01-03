import 'dotenv/config'
import express from 'express';
import db from '../models/index.js';  // Change to default import

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const CategoryModel = db.Category;
    const categories = await CategoryModel.findAll();
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching categories', error: error.message });
  }
});

export default router;