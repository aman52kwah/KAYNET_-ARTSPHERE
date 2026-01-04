import 'dotenv/config'
import express from 'express';
//import {modelsPromise} from '../models/index.js';  // Change to default import
import models from '../models/index.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const dbModels = models;
    const CategoryModel = dbModels.Category;
    const categories = await CategoryModel.findAll();
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching categories', error: error.message });
  }
});

export default router;