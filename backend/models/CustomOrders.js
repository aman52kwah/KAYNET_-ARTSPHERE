import { DataTypes } from "sequelize";
import { sequelize as sequelizePromise } from '../db/db.js';

async function defineCustomOrder(){

 const sequelize = await sequelizePromise;

if(!sequelize){
    throw new Error("sequelize Sequelize instance is undefined. Check db.js configuration.")
}
const CustomOrder = sequelize.define(
    'customOrder',
    {
        id:{
            type:DataTypes.UUID,
            defaultValue:DataTypes.UUIDV4,
            primaryKey:true,
            allowNull:false,
        },
        userId:{
            type:DataTypes.UUID,
            allowNull:false,
        },
        styel:{
            type:DataTypes.STRING,
        },

           size:{
            type:DataTypes.STRING,
        },

        material:{
            type:DataTypes.STRING,
        },
        price:{
            type:DataTypes.DECIMAL
        },
         initialPayment:{
            type:DataTypes.DECIMAL,
         },
         status:{
            type:DataTypes.ENUM('pending', 'partial_paid', 'completed')
         },
         reference:{
            type:DataTypes.STRING,
         },
         createdAt:{
            type:DataTypes.TIME,
        },
    },
    {tablename:'customOrder',
        timestamps:false,
    });
    return CustomOrder;
}

const CustomOrderPromise = defineCustomOrder().catch((error)=>{
    console.error('Failed to define Custom Orders model:',error);
    throw error;
});

export{CustomOrderPromise as CustomOrder};