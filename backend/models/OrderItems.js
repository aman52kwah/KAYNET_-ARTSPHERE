import  {DataTypes} from 'sequelize'
import { sequelize as sequelizePromise } from '../db/db.js';

async function defineOrderItems(){
    const sequelize = await sequelizePromise;

    if(!sequelize){
        throw new Error("sequelize Sequelize instance is undefined. Check db.js configuration.")
    }
    const OrderItems = sequelize.define(
      "OrderItems",
      {
        id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
          allowNull: false,
        },
        orderId: {
          type: DataTypes.UUID,
          allowNull: false,
        },
        productId: {
          type: DataTypes.UUID,
          allowNull: false,
        },
        quantity: {
          type: DataTypes.INTEGER,
        },
        price: {
          type: DataTypes.DECIMAL(10, 2),
          allowNull: false,
        },
      },
      { tablename: "OrderItems", timestamps: false }
    );
    return OrderItems;
}


const OrderItemsPromise = defineOrderItems().catch((error)=>{
    console.error('Failed to define OrderItems model:',error);
    throw error;
});

export{OrderItemsPromise as OrderItems};

