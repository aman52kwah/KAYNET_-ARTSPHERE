// fix-custom-orders-schema.js
// Run this script once to fix the database schema: node fix-custom-orders-schema.js

import { sequelize } from './db/db.js';

async function fixCustomOrdersSchema() {
  try {
    console.log('🔧 Fixing CustomOrders schema...');
    
    const seq = await sequelize;
    
    // Make styleId nullable
    await seq.query(`
      ALTER TABLE "CustomOrders" 
      ALTER COLUMN "styleId" DROP NOT NULL;
    `);
    console.log('✅ styleId is now nullable');
    
    // Make materialId nullable
    await seq.query(`
      ALTER TABLE "CustomOrders" 
      ALTER COLUMN "materialId" DROP NOT NULL;
    `);
    console.log('✅ materialId is now nullable');
    
    // Add new columns if they don't exist
    const columns = [
      { name: 'fullName', type: 'VARCHAR(255)' },
      { name: 'email', type: 'VARCHAR(255)' },
      { name: 'phone', type: 'VARCHAR(255)' },
      { name: 'garmentType', type: 'VARCHAR(255)' },
      { name: 'garmentLabel', type: 'VARCHAR(255)' },
      { name: 'style', type: 'TEXT' },
      { name: 'occasion', type: 'VARCHAR(255)' },
      { name: 'measurements', type: 'JSONB' },
      { name: 'fabricType', type: 'VARCHAR(255)' },
      { name: 'fabricLabel', type: 'VARCHAR(255)' },
      { name: 'fabricColor', type: 'VARCHAR(255)' },
      { name: 'designDetails', type: 'TEXT' },
      { name: 'referenceImageUrl', type: 'VARCHAR(255)' },
      { name: 'urgency', type: 'VARCHAR(255)' },
      { name: 'urgencyLabel', type: 'VARCHAR(255)' },
      { name: 'specialRequests', type: 'TEXT' },
      { name: 'totalAmount', type: 'DECIMAL(10, 2)' },
      { name: 'depositAmount', type: 'DECIMAL(10, 2)' },
      { name: 'balanceAmount', type: 'DECIMAL(10, 2)' },
      { name: 'shippingAddress', type: 'TEXT' },
    ];
    
    for (const col of columns) {
      try {
        await seq.query(`
          ALTER TABLE "CustomOrders" 
          ADD COLUMN IF NOT EXISTS "${col.name}" ${col.type};
        `);
        console.log(`✅ Column ${col.name} added or already exists`);
      } catch (err) {
        console.log(`ℹ️  Column ${col.name} might already exist`);
      }
    }
    
    // Add status column if it doesn't exist
    try {
      await seq.query(`
        DO $$ 
        BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_CustomOrders_status') THEN
            CREATE TYPE "enum_CustomOrders_status" AS ENUM ('pending', 'in_progress', 'completed', 'cancelled');
          END IF;
        END $$;
      `);
      
      await seq.query(`
        ALTER TABLE "CustomOrders" 
        ADD COLUMN IF NOT EXISTS "status" "enum_CustomOrders_status" DEFAULT 'pending';
      `);
      console.log('✅ status column added or already exists');
    } catch (err) {
      console.log('ℹ️  Status enum might already exist');
    }
    
    // Add paymentStatus column if it doesn't exist
    try {
      await seq.query(`
        DO $$ 
        BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_CustomOrders_paymentStatus') THEN
            CREATE TYPE "enum_CustomOrders_paymentStatus" AS ENUM ('deposit_pending', 'deposit_paid', 'fully_paid');
          END IF;
        END $$;
      `);
      
      await seq.query(`
        ALTER TABLE "CustomOrders" 
        ADD COLUMN IF NOT EXISTS "paymentStatus" "enum_CustomOrders_paymentStatus" DEFAULT 'deposit_pending';
      `);
      console.log('✅ paymentStatus column added or already exists');
    } catch (err) {
      console.log('ℹ️  PaymentStatus enum might already exist');
    }
    
    console.log('\n✨ Schema fix completed successfully!');
    console.log('You can now restart your server and try the custom order again.\n');
    
    await seq.close();
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error fixing schema:', error);
    process.exit(1);
  }
}

fixCustomOrdersSchema();