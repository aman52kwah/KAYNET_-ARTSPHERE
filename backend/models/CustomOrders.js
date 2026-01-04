import { DataTypes } from "sequelize";
import { sequelize as sequelizePromise } from '../db/db.js';

async function defineCustomOrder(){

 const sequelize = await sequelizePromise;

if(!sequelize){
    throw new Error("sequelize Sequelize instance is undefined. Check db.js configuration.")
}
const CustomOrder = sequelize.define(
  "customOrder",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    styleId: {
      type: DataTypes.UUID,
    },
    materialId: {
      type: DataTypes.UUID,
    },

    size: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    measurements: {
      type: DataTypes.JSON,
    },

    totalPrice: {
      type: DataTypes.DECIMAL,
    },
    paidAmount: {
      type: DataTypes.DECIMAL,
    },
    status: {
      type: DataTypes.ENUM(
        "pending",
        "confirmed",
        "in_progress",
        "completed",
        "cancelled"
      ),
      defaultValue: "pending",
    },
    SpecialInstructions: {
      type: DataTypes.TEXT,
    },
    deliveryDate: {
      type: DataTypes.DATE,
    },
  },
  { tablename: "customOrder", timestamps: false }
);
    return CustomOrder;
}

const CustomOrderPromise = defineCustomOrder().catch((error)=>{
    console.error('Failed to define CustomOrders model:',error);
    throw error;
});

export{CustomOrderPromise as CustomOrder};