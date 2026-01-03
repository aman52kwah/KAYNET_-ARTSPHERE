// // cleanupDatabase.js - Run this script to fix constraint issues
// import { sequelize as sequelizePromise } from "./db/db.js";

// async function cleanupDatabase() {
//   try {
//     const sequelize = await sequelizePromise;
    
//     console.log('🔧 Starting database cleanup...');
    
//     // Drop problematic constraints manually
//     const queries = [
//       // Payment table constraints
//       `ALTER TABLE "Payment" DROP CONSTRAINT IF EXISTS "Payment_orderId_fkey"`,
//       `ALTER TABLE "Payment" DROP CONSTRAINT IF EXISTS "Payment_orderId_fkey1"`,
//       `ALTER TABLE "Payment" DROP CONSTRAINT IF EXISTS "Payment_customOrderId_fkey"`,
//       `ALTER TABLE "Payment" DROP CONSTRAINT IF EXISTS "Payment_customOrderId_fkey1"`,
      
//       // Products table constraints
//       `ALTER TABLE "products" DROP CONSTRAINT IF EXISTS "products_categoryId_fkey"`,
//       `ALTER TABLE "products" DROP CONSTRAINT IF EXISTS "products_categoryId_fkey1"`,
      
//       // OrderItems table constraints
//       `ALTER TABLE "OrderItems" DROP CONSTRAINT IF EXISTS "OrderItems_orderId_fkey"`,
//       `ALTER TABLE "OrderItems" DROP CONSTRAINT IF EXISTS "OrderItems_orderId_fkey1"`,
//       `ALTER TABLE "OrderItems" DROP CONSTRAINT IF EXISTS "OrderItems_productId_fkey"`,
//       `ALTER TABLE "OrderItems" DROP CONSTRAINT IF EXISTS "OrderItems_productId_fkey1"`,
      
//       // Orders table constraints
//       `ALTER TABLE "Orders" DROP CONSTRAINT IF EXISTS "Orders_userId_fkey"`,
//       `ALTER TABLE "Orders" DROP CONSTRAINT IF EXISTS "Orders_userId_fkey1"`,
      
//       // CustomOrders table constraints
//       `ALTER TABLE "CustomOrders" DROP CONSTRAINT IF EXISTS "CustomOrders_userId_fkey"`,
//       `ALTER TABLE "CustomOrders" DROP CONSTRAINT IF EXISTS "CustomOrders_userId_fkey1"`,
//       `ALTER TABLE "CustomOrders" DROP CONSTRAINT IF EXISTS "CustomOrders_styleId_fkey"`,
//       `ALTER TABLE "CustomOrders" DROP CONSTRAINT IF EXISTS "CustomOrders_styleId_fkey1"`,
//       `ALTER TABLE "CustomOrders" DROP CONSTRAINT IF EXISTS "CustomOrders_materialId_fkey"`,
//       `ALTER TABLE "CustomOrders" DROP CONSTRAINT IF EXISTS "CustomOrders_materialId_fkey1"`,
      
//       // Style table constraints
//       `ALTER TABLE "Styles" DROP CONSTRAINT IF EXISTS "Styles_categoryId_fkey"`,
//       `ALTER TABLE "Styles" DROP CONSTRAINT IF EXISTS "Styles_categoryId_fkey1"`,
//     ];
    
//     for (const query of queries) {
//       try {
//         await sequelize.query(query);
//         console.log(`✅ Executed: ${query}`);
//       } catch (error) {
//         // Ignore errors for constraints that don't exist
//         if (!error.message.includes('does not exist')) {
//           console.log(`⚠️  Warning: ${error.message}`);
//         }
//       }
//     }
    
//     console.log('\n✨ Database cleanup completed!');
//     console.log('👉 Now restart your server to let Sequelize recreate the constraints.\n');
    
//     await sequelize.close();
//     process.exit(0);
    
//   } catch (error) {
//     console.error('❌ Error during cleanup:', error);
//     process.exit(1);
//   }
// }

// cleanupDatabase();