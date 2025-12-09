import { DataTypes } from "sequelize";
import { sequelize as sequelizePromise } from '../db/db.js';

async function defineCategory(){

 const sequelize = await sequelizePromise;

if(!sequelize){
    throw new Error(" Sequelize instance is undefined. Check db.js configuration.")
}
const Category = sequelize.define(
    'category',
    {
        id:{
            type:DataTypes.UUID,
            defaultValue:DataTypes.UUIDV4,
            primaryKey:true,
        },
     
        name:{
            type:DataTypes.STRING,
            allowNull:false,
        },
        description:{
            type:DataTypes.STRING,
        },

    },
    {tablename:'category',
        timestamps:false,
    });
    return Category;
}

const CategoryPromise = defineCategory().catch((error)=>{
    console.error('Failed to define Category model:',error);
    throw error;
});

export{CategoryPromise as Category};