// scripts/createAdminUser.js
// Run this script to create an admin user: node scripts/createAdminUser.js

import 'dotenv/config';
import bcrypt from 'bcrypt';
import models from '../models/index.js';

async function createAdminUser() {
  try {
    const dbModels = await models;
    const UserModel = dbModels.User;

    const adminEmail = 'admin@example.com';
    const adminPassword = 'Admin123!'; // Change this to a secure password

    // Check if admin already exists
    const existingAdmin = await UserModel.findOne({ 
      where: { email: adminEmail } 
    });

    if (existingAdmin) {
      console.log('❌ Admin user already exists with email:', adminEmail);
      
      // Update existing user to admin role
      existingAdmin.role = 'admin';
      await existingAdmin.save();
      console.log('✅ Updated existing user to admin role');
      process.exit(0);
    }

    // Create new admin user
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    
    const adminUser = await UserModel.create({
      name: 'Admin User',
      email: adminEmail,
      password: hashedPassword,
      role: 'admin'
    });

    console.log('✅ Admin user created successfully!');
    console.log('📧 Email:', adminEmail);
    console.log('🔑 Password:', adminPassword);
    console.log('⚠️  Please change this password after first login!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    process.exit(1);
  }
}

createAdminUser();