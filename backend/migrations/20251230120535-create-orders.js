'use strict';

/** @type {import('sequelize-cli').Migration} */
export async function up(queryInterface, Sequelize) {
await queryInterface.createTable('Orders', 
   {
             id:{
            type:DataTypes.UUID,
            defaultValue:DataTypes.UUIDV4,
            primaryKey:true,
            allowNull:false,
        },
        orderNumber: {
            type:DataTypes.STRING,
            unique:true
        },
        userId:{
            type:DataTypes.UUID,
            allowNull:false,
        },
        totalAmount:{
            type:DataTypes.DECIMAL(10,2),
            allowNull:false
        },
        status:{
            type:DataTypes.ENUM('paid','shipped','pending','processing','delivered','cancelled'),
            defaultValue:'pending'
        },
        shippingAddress:{
            type:DataTypes.TEXT
        },
        },
        {tablename:'orders',
        timestamps:false,
    });
}
   
export async function down(queryInterface, Sequelize) {

    await queryInterface.dropTable('Orders');
   
}
