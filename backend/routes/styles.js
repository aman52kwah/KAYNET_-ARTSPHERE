
import express from 'express';
import db from '../models/index.js';

const router = express.Router();

router.get('/', async(req,res)=>{
    try {
        const StyleModel = db.Style;
        const CategoryModel = db.Category;
        const {category}=req.query;
        const where = category ? {categoryId:category} :{};

        const styles = await StyleModel.findAll({
            where,
            include:CategoryModel
        });
        res.json(styles);
    } catch (error) {
        res.status(500).json({message:'Error fetching styles', error:error.message});
    }
});

router.get('/:id', async(req,res)=>{
    try {
        const style = await StyleModel.findByPk(req.params.id,{include:Category});
        if(!style){
            return res.status(404).json({message:'Style not found'});
        }
        res.json(style)
    } catch (error) {
        res.status(500).json({message:'Error fetching style', error:error.message});
    }
});

export default router;