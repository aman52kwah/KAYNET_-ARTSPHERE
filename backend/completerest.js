// // completeReset.js - Complete database reset with correct table names
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

// async function completeReset() {
//   try {
//     const sequelize = await sequelizePromise;
    
//     console.log('╔════════════════════════════════════════╗');
//     console.log('║   COMPLETE DATABASE RESET              ║');
//     console.log('║   ⚠️  ALL DATA WILL BE DELETED ⚠️      ║');
//     console.log('╚════════════════════════════════════════╝\n');
    
//     console.log('Starting in 3 seconds...\n');
//     await new Promise(resolve => setTimeout(resolve, 3000));
    
//     // Step 1: Drop all tables
//     console.log('Step 1: Dropping all tables...');
//     await sequelize.query('DROP SCHEMA public CASCADE;');
//     await sequelize.query('CREATE SCHEMA public;');
//     await sequelize.query('GRANT ALL ON SCHEMA public TO postgres;');
//     await sequelize.query('GRANT ALL ON SCHEMA public TO public;');
//     console.log('✅ All tables dropped\n');
    
//     // Step 2: Load models
//     console.log('Step 2: Loading models...');
//     const User = await UserPromise;
//     const Category = await CategoryPromise;
//     const Style = await StylePromise;
//     const Material = await MaterialPromise;
//     const Products = await ProductPromise;
//     const Orders = await OrdersPromise;
//     const CustomOrder = await CustomOrderPromise;
//     const OrderItems = await OrderItemsPromise;
//     const Payment = await PaymentPromise;
//     console.log('✅ Models loaded\n');
    
//     // Step 3: Define associations
//     console.log('Step 3: Defining associations...');
    
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
    
//     console.log('✅ Associations defined\n');
    
//     // Step 4: Create tables in correct order
//     console.log('Step 4: Creating tables...\n');
    
//     await User.sync();
//     console.log('✅ User (table: Users)');
    
//     await Category.sync();
//     console.log('✅ Category (table: categories)');
    
//     await Material.sync();
//     console.log('✅ Material (table: Materials)');
    
//     await Style.sync();
//     console.log('✅ Style (table: Styles)');
    
//     await Products.sync();
//     console.log('✅ Products (table: products)');
    
//     await Orders.sync();
//     console.log('✅ Orders (table: Orders) ← MUST MATCH PAYMENT REFERENCE');
    
//     await CustomOrder.sync();
//     console.log('✅ CustomOrder (table: CustomOrders) ← MUST MATCH PAYMENT REFERENCE');
    
//     await OrderItems.sync();
//     console.log('✅ OrderItems (table: OrderItems)');
    
//     await Payment.sync();
//     console.log('✅ Payment (table: Payment)');
    
//     // Step 5: Verify table names
//     console.log('\nStep 5: Verifying table names...');
//     const [tables] = await sequelize.query(`
//       SELECT table_name 
//       FROM information_schema.tables 
//       WHERE table_schema = 'public' 
//       ORDER BY table_name;
//     `);
    
//     console.log('\nCreated tables:');
//     tables.forEach(t => console.log(`  ✓ ${t.table_name}`));
    
//     console.log('\n✨ Database reset complete!');
//     console.log('👉 You can now start your server\n');
    
//     await sequelize.close();
//     process.exit(0);
    
//   } catch (error) {
//     console.error('❌ Error:', error);
//     console.error('\nFull error:', error.message);
//     process.exit(1);
//   }
// }

// completeReset();