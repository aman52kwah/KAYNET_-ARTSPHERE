import { DataTypes } from "sequelize";
import { sequelize as sequelizePromise } from "../db/db.js";

async function defineOrders() {
  const sequelize = await sequelizePromise;

  if (!sequelize) {
    throw new Error(
      " Sequelize instance is undefined. Check db.js configuration."
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
      shippingAddress: {
        type: DataTypes.TEXT,
      },
    },
    { tablename: "orders", timestamps: false }
  );

  return Orders;
}

const OrdersPromise = defineOrders().catch((error) => {
  console.error("Falied to define Orders Model:", error);
  throw new Error();
});
export { OrdersPromise as Orders };
