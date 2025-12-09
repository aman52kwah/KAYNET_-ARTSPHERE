import { DataTypes } from "sequelize";
import { sequelize as sequelizePromise } from '../db/db.js';

async function defineProducts(){

 const sequelize = await sequelizePromise;

if(!sequelize){
    throw new Error("sequelize Sequelize instance is undefined. Check db.js configuration.")
}
const Products = sequelize.define(
    'products',
    {
        id:{
            type:DataTypes.UUID,
            defaultValue:DataTypes.UUIDV4,
            primaryKey:true,
            allowNull:false,
        },
        name:{
            type:DataTypes.STRING,
            allowNull:false,
        },
        description:{
            type:DataTypes.STRING,
        },
        price:{
            type:DataTypes.DECIMAL(10,2),
            allowNull:false,
        },
            size:{
            type:DataTypes.STRING,
        },
        color:{
            type:DataTypes.STRING,
        },

         material:{
            type:DataTypes.STRING,
        },
         stockQuantity:{
            type:DataTypes.INTEGER,
            defaultValue:0
        },
         
        imageUrl:{
            type:DataTypes.STRING
        },
        categoryId:{
            type:DataTypes.UUID
        }


    },
    {tablename:'products',
        timestamps:false,
    });
    return Products;
}

const ProductPromise = defineProducts().catch((error)=>{
    console.error('Failed to define Products model:',error);
    throw error;
});

export{ProductPromise as Products};


//id (PK, integer),
//  name (string),
//  price (decimal),
//  size (string), 
// material (string), 
// stock (integer), 
// description (string), 
// imageUrl (string)