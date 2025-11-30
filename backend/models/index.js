import { sequelize as sequelizePromise } from "../db/db.js";
import { User as UserPromise } from "../models/User.js";
import { Products as ProductPromise } from "../models/Products.js";
import { CustomOrder as CustomOrderPromise } from "../models/CustomOrders.js";
import { Orders as OrdersPromise } from "../models/Orders.js";
import { OrderItems as OrderItemsPromise } from "../models/OrderItems.js";

async function initializeModels() {
  const sequelize = await sequelizePromise;
  const User = await UserPromise;
  const Products = await ProductPromise;
  const OrderItems = await OrderItemsPromise;
  const Orders = await OrdersPromise;
  const CustomOrder = await CustomOrderPromise;

  //define associations
  CustomOrder.belongsTo(User, { foreignKey: "userId", as: "user" });

  // Sync models with the database
  await sequelize.sync({ alter: true });
  console.log("Models synchronized with the database.");

  return { sequelize, User, Products, OrderItems, Orders, CustomOrder };
}

const modelsPromise = initializeModels();

export { modelsPromise };
