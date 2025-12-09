import { DataTypes } from "sequelize";
import { sequelize as sequelizePromise } from '../db/db.js';

async function definePayment() {
    
    const sequelize = await sequelizePromise;

    if(!sequelize){
        throw new Error("Sequelize instance is undefined. Check db.js configuration.")
    };

    const Payment = sequelize.define('Payment', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  orderId: {
    type: DataTypes.UUID,
  },
  customOrderId: {
    type: DataTypes.UUID,
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  paystackReference: {
    type: DataTypes.STRING,
    unique: true
  },
  status: {
    type: DataTypes.ENUM('pending', 'success', 'failed'),
    defaultValue: 'pending'
  },
  paymentType:{
    type: DataTypes.ENUM('full', 'partial'),
    defaultValue: 'full'
  },
},
{ tablename: "Payment", timestamps: false }
);
    return Payment;
}

const PaymentPromise = definePayment().catch((error)=>{
    console.error('Failed to define Payment model:',error);
    throw error;
});

export{PaymentPromise as Payment};
