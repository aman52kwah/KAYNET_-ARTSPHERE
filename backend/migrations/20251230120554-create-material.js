'use strict';

/** @type {import('sequelize-cli').Migration} */
export async function up(queryInterface, Sequelize) {
 await queryInterface.createTable('Material',
  {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  pricePerMeter: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  available: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
}
 );
}
export async function down(queryInterface, Sequelize) {

    await queryInterface.dropTable('Material');
  
}s
