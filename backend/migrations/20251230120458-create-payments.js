'use strict';

export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable('Payments', {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    orderId: {
      type: Sequelize.UUID,
      allowNull: true,
      references: { model: 'Orders', key: 'id' }, // <-- Reference other table names here for FKs
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL', // Adjust based on your associations
    },
    customOrderId: {
      type: Sequelize.UUID,
      allowNull: true,
      references: { model: 'CustomOrders', key: 'id' }, // <-- Another table name reference
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    },
    amount: {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: false,
    },
    currency: {
      type: Sequelize.STRING(3),
      defaultValue: 'GHS',
      allowNull: false,
    },
    paymentMethod: {
      type: Sequelize.ENUM('mobile_money', 'card', 'cash', 'bank_transfer', 'paypal', 'stripe'),
      allowNull: true,
    },
    paymentProvider: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    paymentStatus: {
      type: Sequelize.ENUM('pending', 'processing', 'paid', 'failed', 'refunded', 'cancelled'),
      defaultValue: 'pending',
      allowNull: false,
    },
    transactionId: {
      type: Sequelize.STRING(255),
      allowNull: true,
      unique: true, // Handle unique constraints here if needed
    },
    referenceNumber: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    paymentDate: {
      type: Sequelize.DATE,
      allowNull: true,
    },
    paidBy: {
      type: Sequelize.JSONB,
      allowNull: true,
      defaultValue: {},
    },
    paymentDetails: {
      type: Sequelize.JSONB,
      allowNull: true,
      defaultValue: {},
    },
    gatewayResponse: {
      type: Sequelize.JSONB,
      allowNull: true,
      defaultValue: {},
    },
    failureReason: {
      type: Sequelize.TEXT,
      allowNull: true,
    },
    refundAmount: {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: true,
    },
    refundDate: {
      type: Sequelize.DATE,
      allowNull: true,
    },
    refundReason: {
      type: Sequelize.TEXT,
      allowNull: true,
    },
    refundTransactionId: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    isDeposit: {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
    isFinalPayment: {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
    notes: {
      type: Sequelize.TEXT,
      allowNull: true,
    },
    metadata: {
      type: Sequelize.JSONB,
      allowNull: true,
      defaultValue: {},
    },
    createdAt: {
      type: Sequelize.DATE,
      allowNull: false,
    },
    updatedAt: {
      type: Sequelize.DATE,
      allowNull: false,
    }
  });

  // Add indexes here if needed (from your model)
  // await queryInterface.addIndex('Payments', ['orderId']);
  // await queryInterface.addIndex('Payments', ['customOrderId']);
  // await queryInterface.addIndex('Payments', ['transactionId']);
  // await queryInterface.addIndex('Payments', ['paymentStatus']);
  // await queryInterface.addIndex('Payments', ['paymentDate']);
}
export async function down(queryInterface, Sequelize) {
  await queryInterface.dropTable('Payments'); // <-- Table name here again for rollback
}