'use strict';

/** @type {import('sequelize-cli').Migration} */
export async function up(queryInterface, Sequelize) {
   await queryInterface.createTable('CustomOrders', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    styleId: {
      type: DataTypes.UUID,
    },
    materialId: {
      type: DataTypes.UUID,
    },

    size: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    measurements: {
      type: DataTypes.JSON,
    },

    totalPrice: {
      type: DataTypes.DECIMAL,
    },
    paidAmount: {
      type: DataTypes.DECIMAL,
    },
    status: {
      type: DataTypes.ENUM(
        "pending",
        "confirmed",
        "in_progress",
        "completed",
        "cancelled"
      ),
      defaultValue: "pending",
    },
    SpecialInstructions: {
      type: DataTypes.TEXT,
    },
    deliveryDate: {
      type: DataTypes.DATE,
    },
  });
}
export async function down(queryInterface, Sequelize) {
await queryInterface.dropTable('CustomOrders');
  
}
