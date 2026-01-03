import { DataTypes } from "sequelize";
import { sequelize as sequelizePromise } from '../db/db.js';
async function definePayment(){

 const sequelize = await sequelizePromise;

if(!sequelize){
    throw new Error("sequelize Sequelize instance is undefined. Check db.js configuration.")
}

  const Payment = sequelize.define('Payment', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    orderId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    customOrderId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        isDecimal: { msg: 'Amount must be a valid decimal number' },
        min: { args: [0], msg: 'Amount cannot be negative' }
      }
    },
    currency: {
      type: DataTypes.STRING(3),
      defaultValue: 'GHS',
      allowNull: false,
    },
    paymentMethod: {
      type: DataTypes.ENUM('mobile_money', 'card', 'cash', 'bank_transfer', 'paypal', 'stripe'),
      allowNull: true,
      validate: { notEmpty: { msg: 'Payment method is required' } }
    },
    paymentProvider: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    paymentStatus: {
      type: DataTypes.ENUM('pending', 'processing', 'paid', 'failed', 'refunded', 'cancelled'),
      defaultValue: 'pending',
      allowNull: false,
    },
    transactionId: {
      type: DataTypes.STRING(255),
      allowNull: true,
      unique: true,
    },
    referenceNumber: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    paymentDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    paidBy: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {},
    },
    paymentDetails: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {},
    },
    gatewayResponse: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {},
    },
    failureReason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    refundAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    refundDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    refundReason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    refundTransactionId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    isDeposit: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
    isFinalPayment: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {},
    }
  }, {
    tableName: 'Payments',
    timestamps: true,
    indexes: [
      { fields: ['orderId'] },
      { fields: ['customOrderId'] },
      { fields: ['transactionId'] },
      { fields: ['paymentStatus'] },
      { fields: ['paymentDate'] }
    ],
    validate: {
      eitherOrderOrCustomOrder() {
        if (!this.orderId && !this.customOrderId) {
          throw new Error('Payment must be associated with either an Order or CustomOrder');
        }
        if (this.orderId && this.customOrderId) {
          throw new Error('Payment cannot be associated with both Order and CustomOrder');
        }
      }
    },
    hooks: {
      beforeCreate: (payment) => {
        if (!payment.referenceNumber) {
          const timestamp = Date.now();
          const random = Math.random().toString(36).substring(2, 9).toUpperCase();
          payment.referenceNumber = `PAY-${timestamp}-${random}`;
        }
        if (payment.paymentStatus === 'completed' && !payment.paymentDate) {
          payment.paymentDate = new Date();
        }
      },
      beforeUpdate: (payment) => {
        if (payment.changed('paymentStatus') && payment.paymentStatus === 'completed' && !payment.paymentDate) {
          payment.paymentDate = new Date();
        }
        if (payment.changed('paymentStatus') && payment.paymentStatus === 'refunded' && !payment.refundDate) {
          payment.refundDate = new Date();
        }
      }
    }
  });

  Payment.associate = function (models) {
    Payment.belongsTo(models.Orders, { foreignKey: 'orderId', as: 'order' });
    Payment.belongsTo(models.CustomOrder, { foreignKey: 'customOrderId', as: 'customOrder' });
  };

  Payment.prototype.isPending = function() { return this.paymentStatus === 'pending'; };
  Payment.prototype.isCompleted = function() { return this.paymentStatus === 'completed'; };
  Payment.prototype.isFailed = function() { return this.paymentStatus === 'failed'; };
  Payment.prototype.canBeRefunded = function() { return this.paymentStatus === 'completed' && !this.refundAmount; };

  return Payment;

  
}

const PaymentPromise = definePayment().catch((error)=>{
    console.error('Failed to define User model:',error);
    throw error;
});

export{PaymentPromise as Payment};