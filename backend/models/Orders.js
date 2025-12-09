import  {DataTypes} from 'sequelize'
import { sequelize as sequelizePromise } from '../db/db.js';

async function defineOrders(){
    const sequelize = await sequelizePromise;

    if(!sequelize){
        throw new Error("sequelize Sequelize instance is undefined. Check db.js configuration.")
    }
    const Orders = sequelize.define(
        'orders',
        {
             id:{
            type:DataTypes.UUID,
            defaultValue:DataTypes.UUIDV4,
            primaryKey:true,
            allowNull:false,
        },
        orderNumber: {
            type:DataTypes.STRING,
            unique:true
        },
        userId:{
            type:DataTypes.UUID,
            allowNull:false,
        },
        totalAmount:{
            type:DataTypes.DECIMAL(10,2),
            allowNull:false
        },
        status:{
            type:DataTypes.ENUM('paid','shipped','pending','processing','delivered','cancelled'),
            defaultValue:'pending'
        },
        shippingAddress:{
            type:DataTypes.TEXT
        },
        },
        {tablename:'orders',
        timestamps:false,
    });
    return Orders;
}


const OrdersPromise = defineOrders().catch((error)=>{
    console.error('Failed to define Orders model:',error);
    throw error;
});

export{OrdersPromise as Orders};







//id (PK, integer), 
// userId (FK, integer), 
// totalAmount (decimal), 
// status (enum: 'paid', 'shipped'), 
// createdAt (timestamp)