// // resetDatabase.js - Run this ONCE to reset your database
// import { sequelize as sequelizePromise } from "./db/db.js";
// import { User as UserPromise } from "./models/User.js";
// import { Products as ProductPromise } from "./models/Products.js";
// import { CustomOrder as CustomOrderPromise } from "./models/CustomOrders.js";
// import { Orders as OrdersPromise } from "./models/Orders.js";
// import { OrderItems as OrderItemsPromise } from "./models/OrderItems.js";
// import { Category as CategoryPromise } from "./models/Category.js";
// import { Style as StylePromise } from "./models/Style.js";
// import { Material as MaterialPromise } from "./models/Material.js";
// import { Payment as PaymentPromise } from "./models/Payment.js";

// async function resetDatabase() {
//   try {
//     const sequelize = await sequelizePromise;
    
//     console.log('⚠️  WARNING: This will DELETE ALL DATA in your database!');
//     console.log('🔄 Starting database reset in 3 seconds...');
    
//     // Wait 3 seconds to give user time to cancel
//     await new Promise(resolve => setTimeout(resolve, 3000));
    
//     console.log('🔄 Loading models...');
    
//     // Load all models
//     const User = await UserPromise;
//     const Category = await CategoryPromise;
//     const Style = await StylePromise;
//     const Material = await MaterialPromise;
//     const Products = await ProductPromise;
//     const Orders = await OrdersPromise;
//     const CustomOrder = await CustomOrderPromise;
//     const OrderItems = await OrderItemsPromise;
//     const Payment = await PaymentPromise;

//     console.log('✅ All models loaded');

//     // Define all associations
//     console.log('🔄 Defining associations...');
    
//     User.hasMany(CustomOrder, { foreignKey: 'userId' });
//     User.hasMany(Orders, { foreignKey: 'userId' });

//     Category.hasMany(Style, { foreignKey: 'categoryId' });
//     Category.hasMany(Products, { foreignKey: 'categoryId' });

//     Style.belongsTo(Category, { foreignKey: 'categoryId' });
//     Style.hasMany(CustomOrder, { foreignKey: 'styleId' });

//     Material.hasMany(CustomOrder, { foreignKey: 'materialId' });

//     CustomOrder.belongsTo(User, { foreignKey: 'userId' });
//     CustomOrder.belongsTo(Style, { foreignKey: 'styleId' });
//     CustomOrder.belongsTo(Material, { foreignKey: 'materialId' });
//     CustomOrder.hasMany(Payment, { foreignKey: 'customOrderId', as: 'payments' });

//     Orders.belongsTo(User, { foreignKey: 'userId' });
//     Orders.hasMany(OrderItems, { foreignKey: 'orderId' });
//     Orders.hasMany(Payment, { foreignKey: 'orderId', as: 'payments' });

//     OrderItems.belongsTo(Orders, { foreignKey: 'orderId' });
//     OrderItems.belongsTo(Products, { foreignKey: 'productId', as: 'product' });

//     Products.belongsTo(Category, { foreignKey: 'categoryId', as: 'category' });
//     Products.hasMany(OrderItems, { foreignKey: 'productId', as: 'orderItems' });

//     Payment.belongsTo(Orders, { foreignKey: 'orderId', as: 'order' });
//     Payment.belongsTo(CustomOrder, { foreignKey: 'customOrderId', as: 'customOrder' });

//     console.log('✅ All associations defined');

//     // Drop all tables and recreate them
//     console.log('🔄 Dropping all tables...');
//     await sequelize.drop();
//     console.log('✅ All tables dropped');

//     // Recreate all tables in the correct order
//     console.log('🔄 Creating tables in correct order...');
    
//     await User.sync();
//     console.log('✅ User table created');
    
//     await Category.sync();
//     console.log('✅ Category table created');
    
//     await Material.sync();
//     console.log('✅ Material table created');
    
//     await Style.sync();
//     console.log('✅ Style table created');
    
//     await Products.sync();
//     console.log('✅ Products table created');
    
//     await Orders.sync();
//     console.log('✅ Orders table created');
    
//     await CustomOrder.sync();
//     console.log('✅ CustomOrder table created');
    
//     await OrderItems.sync();
//     console.log('✅ OrderItems table created');
    
//     await Payment.sync();
//     console.log('✅ Payment table created');

//     console.log('\n✨ Database reset completed successfully!');
//     console.log('👉 You can now start your server normally.\n');
    
//     await sequelize.close();
//     process.exit(0);
    
//   } catch (error) {
//     console.error('❌ Error during database reset:', error);
//     process.exit(1);
//   }
// }

// console.log('╔════════════════════════════════════════╗');
// console.log('║     DATABASE RESET SCRIPT              ║');
// console.log('║     ⚠️  ALL DATA WILL BE DELETED ⚠️    ║');
// console.log('╚════════════════════════════════════════╝');
// //console.log('');

// resetDatabase();