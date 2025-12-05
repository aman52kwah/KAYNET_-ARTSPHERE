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

//===========define associations================//
//User Associations (One-to-Many)
User.hasMany(CustomOrder, { 
  foreignKey: "userId", 
  as: "customOrders",
  onDelete: "CASCADE" 
});

User.hasMany(Orders, { 
  foreignKey: "userId", 
  as: "orders",
  onDelete: "CASCADE" 
});

//customOrders Associations (Many-to-One)
CustomOrder.belongsTo(User, { 
  foreignKey: "userId", 
  as: "user" 
});

//orders Association
Orders.belongsTo(User, { 
  foreignKey: "userId", 
  as: "user" 
});

Orders.hasMany(OrderItems, { 
  foreignKey: "orderId", 
  as: "orderItems",
  onDelete: "CASCADE" 
});

//orderItems Associations
OrderItems.belongsTo(Orders, { 
  foreignKey: "orderId", 
  as: "order" 
});

OrderItems.belongsTo(Products, { 
  foreignKey: "productId", 
  as: "product" 
});

//products Association
Products.hasMany(OrderItems, { 
  foreignKey: "productId", 
  as: "orderItems",
  onDelete: "RESTRICT" 
});




  // Sync models with the database
  await sequelize.sync({ alter: true });
  console.log("Models synchronized with the database.");

  return { sequelize, User, Products, OrderItems, Orders, CustomOrder };
}

const modelsPromise = initializeModels();

export { modelsPromise };
