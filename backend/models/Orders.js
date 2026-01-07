import { DataTypes } from "sequelize";
import { sequelize as sequelizePromise } from "../db/db.js";

async function defineOrders() {
  const sequelize = await sequelizePromise;

  if (!sequelize) {
    throw new Error(
      "Sequelize instance is undefined. Check db.js configuration."
    );
  }

  const Orders = sequelize.define(
    "Orders",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      orderNumber: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false,
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      totalAmount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM(
          "paid",
          "shipped",
          "pending",
          "processing",
          "delivered",
          "cancelled"
        ),
        defaultValue: "pending",
      },
      orderType: {
  type: DataTypes.ENUM('regular', 'custom'),
  defaultValue: 'regular',
  allowNull: false,
},
customOrderId: {
  type: DataTypes.UUID,
  allowNull: true,
  references: {
    model: 'CustomOrders',
    key: 'id',
  },
},
      shippingAddress: {
        type: DataTypes.TEXT,
      },
      paymentStatus: {
        type: DataTypes.ENUM("pending", "paid", "failed"),
        defaultValue: "pending",
      },
      createdAt: {  // FIXED: was "createAt"
        type: DataTypes.DATE,
      },
      updatedAt: {
        type: DataTypes.DATE,
      },
    },
    { 
      tableName: "Orders",  // FIXED: was "tablename" (should be tableName with capital N)
      timestamps: true      // CHANGED: Set to true so Sequelize manages createdAt/updatedAt
    }
  );

  return Orders;
}

const OrdersPromise = defineOrders().catch((error) => {
  console.error("Failed to define Orders Model:", error);  // FIXED: was "Falied"
  throw error;  // FIXED: Should throw the actual error, not new Error()
});

export { OrdersPromise as Orders };