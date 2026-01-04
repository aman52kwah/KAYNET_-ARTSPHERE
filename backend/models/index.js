import { sequelize as sequelizePromise } from "../db/db.js";
import { User as UserPromise } from "./User.js";
import { Products as ProductPromise } from "./Products.js";
import { CustomOrder as CustomOrderPromise } from "./CustomOrders.js";
import { Orders as OrdersPromise } from "./Orders.js";
import { OrderItems as OrderItemsPromise } from "./OrderItems.js";
import { Category as CategoryPromise } from "./Category.js";
import { Style as StylePromise } from "./Style.js";
import { Material as MaterialPromise } from "./Material.js";
import { Payment as PaymentPromise } from "./Payment.js";

export const sequelize = await sequelizePromise;

async function initializeModels() {
  const sequelize = await sequelizePromise;
  
  console.log('🔄 Loading models...');
  
  // Load all models
  const User = await UserPromise;
  const Category = await CategoryPromise;
  const Style = await StylePromise;
  const Material = await MaterialPromise;
  const Products = await ProductPromise;
  const Orders = await OrdersPromise;
  const CustomOrder = await CustomOrderPromise;
  const OrderItems = await OrderItemsPromise;
  const Payment = await PaymentPromise;

  console.log('✅ All models loaded');

  //===========DEFINE ASSOCIATIONS================//
  console.log('🔄 Defining associations...');
  
  // USER ASSOCIATIONS
  User.hasMany(Orders, { 
    foreignKey: 'userId',
    as: 'orders',
    onDelete: 'CASCADE'
  });
  
  User.hasMany(CustomOrder, { 
    foreignKey: 'userId',
    as: 'customOrders',
    onDelete: 'CASCADE'
  });

  // CATEGORY ASSOCIATIONS
  Category.hasMany(Style, { 
    foreignKey: 'categoryId',
    as: 'styles',
    onDelete: 'CASCADE'
  });
  
  Category.hasMany(Products, { 
    foreignKey: 'categoryId',
    as: 'products',
    onDelete: 'CASCADE'
  });

  // STYLE ASSOCIATIONS
  Style.belongsTo(Category, { 
    foreignKey: 'categoryId',
    as: 'category'
  });
  
  Style.hasMany(CustomOrder, { 
    foreignKey: 'styleId',
    as: 'customOrders',
    onDelete: 'RESTRICT'
  });

  // MATERIAL ASSOCIATIONS
  Material.hasMany(CustomOrder, { 
    foreignKey: 'materialId',
    as: 'customOrders',
    onDelete: 'RESTRICT'
  });

  // PRODUCT ASSOCIATIONS
  Products.belongsTo(Category, { 
    foreignKey: 'categoryId',
    as: 'category'
  });
  
  Products.hasMany(OrderItems, { 
    foreignKey: 'productId',
    as: 'orderItems',
    onDelete: 'RESTRICT'
  });

  // ORDER ASSOCIATIONS
  Orders.belongsTo(User, { 
    foreignKey: 'userId',
    as: 'user'
  });
  
  Orders.hasMany(OrderItems, { 
    foreignKey: 'orderId',
    as: 'items',
    onDelete: 'CASCADE'
  });
  
  Orders.hasMany(Payment, { 
    foreignKey: 'orderId',
    as: 'payments',
    onDelete: 'CASCADE'
  });

  // ORDER ITEMS ASSOCIATIONS
  OrderItems.belongsTo(Orders, { 
    foreignKey: 'orderId',
    as: 'order'
  });
  
  OrderItems.belongsTo(Products, { 
    foreignKey: 'productId',
    as: 'product'
  });

  // CUSTOM ORDER ASSOCIATIONS
  CustomOrder.belongsTo(User, { 
    foreignKey: 'userId',
    as: 'user'
  });
  
  CustomOrder.belongsTo(Style, { 
    foreignKey: 'styleId',
    as: 'style'
  });
  
  CustomOrder.belongsTo(Material, { 
    foreignKey: 'materialId',
    as: 'material'
  });
  
  CustomOrder.hasMany(Payment, { 
    foreignKey: 'customOrderId',
    as: 'payments',
    onDelete: 'CASCADE'
  });

  // PAYMENT ASSOCIATIONS
  Payment.belongsTo(Orders, { 
    foreignKey: 'orderId',
    as: 'order'
  });
  
  Payment.belongsTo(CustomOrder, { 
    foreignKey: 'customOrderId',
    as: 'customOrder'
  });

  console.log('✅ All associations defined');

  // SYNC MODELS IN CORRECT ORDER
  try {
    console.log('🔄 Starting database sync...\n');
    
    // Step 1: Independent tables (no foreign keys)
    await User.sync({ alter: true });
    console.log('✅ Users table synced');
    
    await Category.sync({ alter: true });
    console.log('✅ Categories table synced');
    
    await Material.sync({ alter: true });
    console.log('✅ Materials table synced');
    
    // Step 2: Tables that depend on Category
    await Style.sync({ alter: true });
    console.log('✅ Styles table synced');
    
    await Products.sync({ alter: true });
    console.log('✅ Products table synced');
    
    // Step 3: Tables that depend on User
    await Orders.sync({ alter: true });
    console.log('✅ Orders table synced');
    
    // Step 4: Tables that depend on User, Style, and Material
    await CustomOrder.sync({ alter: true });
    console.log('✅ CustomOrders table synced');
    
    // Step 5: Tables that depend on Orders and Products
    await OrderItems.sync({ alter: true });
    console.log('✅ OrderItems table synced');
    
    // Step 6: Payment (depends on Orders and CustomOrders)
    await Payment.sync({ alter: true });
    console.log('✅ Payments table synced');
    
    console.log('\n✨ All models synchronized with the database!');
    
  } catch (error) {
    console.error('❌ Error during database sync:', error);
    throw error;
  }

  return {
    sequelize,
    User,
    Products,
    OrderItems,
    Orders,
    CustomOrder,
    Category,
    Style,
    Material,
    Payment,
  };
}

// Initialize models and wait for completion
const models = await initializeModels();

// Export individual models for direct use
export const User = models.User;
export const Products = models.Products;
export const Orders = models.Orders;
export const OrderItems = models.OrderItems;
export const CustomOrder = models.CustomOrder;
export const Category = models.Category;
export const Style = models.Style;
export const Material = models.Material;
export const Payment = models.Payment;

// Export default
export default models;