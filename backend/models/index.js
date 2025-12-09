import { sequelize as sequelizePromise } from "../db/db.js";
import { User as UserPromise } from "../models/User.js";
import { Products as ProductPromise } from "../models/Products.js";
import { CustomOrder as CustomOrderPromise } from "../models/CustomOrders.js";
import { Orders as OrdersPromise } from "../models/Orders.js";
import { OrderItems as OrderItemsPromise } from "../models/OrderItems.js";
import {Category as CategoryPromise} from "../models/Category.js";
import {Style as StylePromise} from "../models/Style.js";
import {Material as MaterialPromise} from "../models/Material.js";
import {Payment as PaymentPromise} from "../models/Payment.js";


async function initializeModels() {
  const sequelize = await sequelizePromise;
  const User = await UserPromise;
  const Products = await ProductPromise;
  const OrderItems = await OrderItemsPromise;
  const Orders = await OrdersPromise;
  const CustomOrder = await CustomOrderPromise;
  const Category = await CategoryPromise;
  const Style = await StylePromise;
  const Material = await MaterialPromise;
  const Payment = await PaymentPromise;

//===========define associations================//
User.hasMany(CustomOrder, { foreignKey: 'userId' });
User.hasMany(Orders, { foreignKey: 'userId' });

Category.hasMany(Style, { foreignKey: 'categoryId' });
Category.hasMany(Products, { foreignKey: 'categoryId' });

Style.belongsTo(Category, { foreignKey: 'categoryId' });
Style.hasMany(CustomOrder, { foreignKey: 'styleId' });

Material.hasMany(CustomOrder, { foreignKey: 'materialId' });

CustomOrder.belongsTo(User, { foreignKey: 'userId' });
CustomOrder.belongsTo(Style, { foreignKey: 'styleId' });
CustomOrder.belongsTo(Material, { foreignKey: 'materialId' });
CustomOrder.hasMany(Payment, { foreignKey: 'customOrderId' });

Orders.belongsTo(User, { foreignKey: 'userId' });
Orders.hasMany(OrderItems, { foreignKey: 'orderId' });
Orders.hasMany(Payment, { foreignKey: 'orderId' });

OrderItems.belongsTo(Orders, { foreignKey: 'orderId' });
OrderItems.belongsTo(Products, { foreignKey: 'productId' });

Products.belongsTo(Category, { foreignKey: 'categoryId' });
Products.hasMany(OrderItems, { foreignKey: 'productId' });

Payment.belongsTo(Orders, { foreignKey: 'orderId' });
Payment.belongsTo(CustomOrder, { foreignKey: 'customOrderId' });





  // Sync models with the database
  await sequelize.sync({ alter: true });
  console.log("Models synchronized with the database.");

  return { sequelize, User, Products, OrderItems, Orders, CustomOrder };
}

const modelsPromise = initializeModels();

export { modelsPromise };
