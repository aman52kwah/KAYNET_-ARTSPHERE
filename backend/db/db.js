// db.js
import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    dialectOptions: {
        ssl: {
            require: true,
            rejectUnauthorized: false,
        },
    },
    logging: false,
});

async function initializeDatabase() {
    try {
        //console.log('Attempting to connect to "emsdb" database...');
        await sequelize.authenticate();
        //console.log('Connection to "emsdb" database established successfully.');

        // Enable UUID extension
        await sequelize.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
        console.log('UUID extension enabled successfully.');

        return sequelize;
    } catch (error) {
        console.error('Unable to connect to  database:', error.message);
        throw error;
    }
}

const sequelizePromise = initializeDatabase().catch((error) => {
    console.error('Failed to initialize database:', error);
    throw error;
});

export { sequelizePromise as sequelize };