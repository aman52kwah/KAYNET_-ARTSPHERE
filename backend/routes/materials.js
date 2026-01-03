import express from 'express';
const router = express.Router();
import db from '../models/index.js';

router.get('/',async(req,res)=>{
    try {
       
        const MaterialModel = db.Material;
        const materials = await MaterialModel.findAll();
        res.json(materials);
    } catch (error) {
        res.status(500).json({message:'Error fetching materials', error:error.message});
    }
});

export default router;